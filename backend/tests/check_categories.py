"""Self-check de categorías personalizables. Ejecutar desde backend/: python tests/check_categories.py"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["DATABASE_URL"] = os.environ.get("CHECK_DATABASE_URL") or f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'cat.db')}"
os.environ["DATABASE_POOLER_URL"] = ""

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.models import User  # noqa: E402

API = "/api/v1"

with TestClient(app) as c:
    db = SessionLocal()
    user = User(email="c@example.com", full_name="C", is_verified=True)
    db.add(user)
    db.commit()
    H = {"Authorization": f"Bearer {create_access_token(user.id)}"}
    db.close()

    def req(method, path, body=None, expect=None):
        r = c.request(method, f"{API}{path}", json=body, headers=H)
        if expect:
            assert r.status_code == expect, (method, path, r.status_code, r.text)
        return r.json() if r.content else None

    def cats(kind):
        return {x["name"]: x for x in req("GET", "/categories", expect=200) if x["kind"] == kind}

    bank = req("POST", "/accounts", {"name": "Banco", "type": "bank", "balance": 10000}, 201)
    card = req("POST", "/accounts", {"name": "Visa", "type": "credit_card", "balance": 500, "credit_limit": 5000}, 201)
    savings = req("POST", "/accounts", {"name": "Ahorro", "type": "savings", "balance": 0}, 201)
    # Gasto en una categoría propia anterior a esta función: se conserva al crear la lista
    req("POST", "/expenses", {"account_id": bank["id"], "category": "Comida casera", "description": "x", "amount": 100, "date": "2026-11-01"}, 201)

    expense = cats("expense")
    assert "Vivienda & Alquiler" in expense and "Comida casera" in expense and len(expense) == 27
    assert expense["Impuestos & Tasas"]["system_key"] == "tax" and expense["Comida casera"]["system_key"] is None
    assert cats("income")["Rendimientos & Intereses Bancarios"]["system_key"] == "card_income"
    assert len(cats("expense")) == 27  # pedirla otra vez no duplica

    # Crear: nombres únicos por tipo sin importar mayúsculas; el mismo nombre sí puede existir en ingresos
    req("POST", "/categories", {"kind": "expense", "name": "  Bebé  "}, 201)
    req("POST", "/categories", {"kind": "expense", "name": "bebé"}, 409)
    req("POST", "/categories", {"kind": "income", "name": "Bebé"}, 201)
    req("POST", "/categories", {"kind": "expense", "name": "   "}, 422)

    # Renombrar una categoría actualiza gastos, presupuesto y recurrentes
    rest = expense["Restaurantes & Bares"]
    e1 = req("POST", "/expenses", {"account_id": bank["id"], "category": "Restaurantes & Bares", "description": "cena", "amount": 200, "date": "2026-11-02"}, 201)
    req("POST", "/budgets", {"category": "Restaurantes & Bares", "allocated_amount": 1000}, 201)
    req("POST", "/recurring", {"kind": "expense", "description": "Club", "category": "Restaurantes & Bares", "amount": 50, "next_date": "2026-12-01"}, 201)
    req("PUT", f"/categories/{rest['id']}", {"name": "Comer fuera"}, 200)
    assert next(x for x in req("GET", "/expenses") if x["id"] == e1["id"])["category"] == "Comer fuera"
    assert [b["category"] for b in req("GET", "/budgets")] == ["Comer fuera"]
    assert req("GET", "/recurring")[0]["category"] == "Comer fuera"
    req("PUT", f"/categories/{rest['id']}", {"name": "vivienda & alquiler"}, 409)

    # Las del sistema se pueden renombrar y su lógica sigue: impuestos de traspasos, abonos a deudas y cashback
    req("PUT", f"/categories/{expense['Impuestos & Tasas']['id']}", {"name": "Tasas DGII"}, 200)
    mov = req("POST", "/movements", {"from_account_id": bank["id"], "to_account_id": savings["id"], "amount": 100, "tax_amount": 1, "date": "2026-11-03"}, 201)
    assert next(x for x in req("GET", "/expenses") if x["id"] == mov["tax_expense_id"])["category"] == "Tasas DGII"

    req("PUT", f"/categories/{expense['Pago de Deudas & Préstamos']['id']}", {"name": "Préstamos"}, 200)
    debt = req("POST", "/debts", {"creditor": "Primo", "total_amount": 100, "remaining_amount": 100}, 201)
    req("POST", f"/debts/{debt['id']}/pay", {"amount": 10, "account_id": bank["id"]}, 200)
    assert any(x["category"] == "Préstamos" and x["debt_id"] == debt["id"] for x in req("GET", "/expenses"))

    req("PUT", f"/categories/{cats('income')['Rendimientos & Intereses Bancarios']['id']}", {"name": "Cashback"}, 200)
    req("POST", "/incomes", {"account_id": card["id"], "category": "Cashback", "description": "cb", "amount": 20, "date": "2026-11-04"}, 201)
    req("POST", "/incomes", {"account_id": card["id"], "category": "Otros Ingresos", "description": "x", "amount": 5, "date": "2026-11-04"}, 400)

    # Eliminar: las del sistema no; las demás mueven todo a la categoría elegida (o a "Otros")
    req("DELETE", f"/categories/{expense['Ahorro Programado']['id']}", expect=400)
    sup = expense["Supermercado & Alimentación"]
    req("POST", "/budgets", {"category": "Supermercado & Alimentación", "allocated_amount": 500}, 201)
    req("DELETE", f"/categories/{rest['id']}?move_to={cats('income')['Bebé']['id']}", expect=400)  # otro tipo
    assert req("DELETE", f"/categories/{rest['id']}?move_to={sup['id']}", expect=200)["moved_to"] == "Supermercado & Alimentación"
    budgets = {b["category"]: b["allocated_amount"] for b in req("GET", "/budgets")}
    assert budgets == {"Supermercado & Alimentación": 1500}, budgets  # presupuestos sumados en uno
    assert next(x for x in req("GET", "/expenses") if x["id"] == e1["id"])["category"] == "Supermercado & Alimentación"
    assert req("GET", "/recurring")[0]["category"] == "Supermercado & Alimentación"
    assert "Comer fuera" not in cats("expense")

    assert req("DELETE", f"/categories/{expense['Comida casera']['id']}", expect=200)["moved_to"] == "Otros Gastos"
    assert all(x["category"] != "Comida casera" for x in req("GET", "/expenses"))

print("OK: checks de categorías pasaron")
