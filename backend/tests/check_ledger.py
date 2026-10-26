"""Self-check de reglas contables. Ejecutar desde backend/: python tests/check_ledger.py"""
import os
import sys
import tempfile
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["DATABASE_URL"] = os.environ.get("CHECK_DATABASE_URL") or f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'ledger.db')}"
os.environ["DATABASE_POOLER_URL"] = ""

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.models import User  # noqa: E402

API = "/api/v1"

with TestClient(app) as c:
    db = SessionLocal()
    user = User(email="l@example.com", full_name="L", is_verified=True, hashed_password=None)
    db.add(user)
    db.commit()
    H = {"Authorization": f"Bearer {create_access_token(user.id)}"}
    db.close()

    def post(path, body, expect=None):
        r = c.post(f"{API}{path}", json=body, headers=H)
        if expect:
            assert r.status_code == expect, (path, r.status_code, r.text)
        return r

    def bal(acc_id):
        return next(a["balance"] for a in c.get(f"{API}/accounts", headers=H).json() if a["id"] == acc_id)

    bank = post("/accounts", {"name": "Banco", "type": "bank", "balance": 1000, "currency": "DOP"}, 201).json()
    card = post("/accounts", {"name": "Visa", "type": "credit_card", "balance": 0, "credit_limit": 500, "currency": "DOP"}, 201).json()
    usd = post("/accounts", {"name": "Dólares", "type": "savings", "balance": 0, "currency": "usd"}, 201).json()
    assert usd["currency"] == "USD"
    assert post("/accounts", {"name": "X", "type": "Efectivo"}, 201).json()["type"] == "cash"
    usd2 = post("/accounts", {"name": "Ahorro DOP", "type": "savings", "balance": 0}, 201).json()

    # Montos exactos: 0.1 + 0.2 sin errores de float
    post("/expenses", {"account_id": bank["id"], "category": "Comida", "description": "a", "amount": 0.1, "date": "2026-10-01"}, 201)
    post("/expenses", {"account_id": bank["id"], "category": "Comida", "description": "b", "amount": 0.2, "date": "hoy"}, 201)
    assert bal(bank["id"]) == 999.7

    # Tarjeta: saldo = consumido; gasto lo sube, pago (traspaso) lo baja; respeta límite
    e = post("/expenses", {"account_id": card["id"], "category": "Comida", "description": "c", "amount": 300, "date": "2026-10-02"}, 201).json()
    assert bal(card["id"]) == 300
    post("/expenses", {"account_id": card["id"], "category": "Comida", "description": "d", "amount": 250, "date": "2026-10-02"}, 400)
    # La tarjeta solo se abona con "Pagar tarjeta": ni traspasos ni ingresos hacia ella
    post("/movements", {"from_account_id": bank["id"], "to_account_id": card["id"], "amount": 100, "date": "2026-10-03"}, 400)
    post("/incomes", {"account_id": card["id"], "category": "Otros", "description": "x", "amount": 10, "date": "2026-10-03"}, 400)
    # Excepción: el cashback (ingreso 'Rendimientos & Intereses Bancarios') sí abona a la tarjeta y baja su consumo
    cb = post("/incomes", {"account_id": card["id"], "category": "Rendimientos & Intereses Bancarios", "description": "cashback",
                           "amount": 25, "date": "2026-10-03"}, 201).json()
    assert bal(card["id"]) == 275
    assert c.put(f"{API}/incomes/{cb['id']}", json={"category": "Otros"}, headers=H).status_code == 400  # deja de ser cashback
    assert c.put(f"{API}/incomes/{cb['id']}", json={"amount": 30}, headers=H).status_code == 200
    assert bal(card["id"]) == 270
    post("/expenses", {"account_id": card["id"], "category": "Comida", "description": "e", "amount": 231, "date": "2026-10-03"}, 400)  # disponible 230
    assert c.delete(f"{API}/incomes/{cb['id']}", headers=H).status_code == 200
    assert bal(card["id"]) == 300
    post(f"/accounts/{card['id']}/pay", {"from_account_id": bank["id"], "amount": 301}, 400)  # más de lo pendiente
    post(f"/accounts/{card['id']}/pay", {"from_account_id": card["id"], "amount": 10}, 400)  # tarjeta con tarjeta
    post(f"/accounts/{bank['id']}/pay", {"from_account_id": bank["id"], "amount": 10}, 404)  # destino no es tarjeta
    pay_mov = post(f"/accounts/{card['id']}/pay", {"from_account_id": bank["id"], "amount": 100, "date": "2026-10-03"}, 201).json()
    assert pay_mov["to_account_id"] == card["id"]
    assert bal(card["id"]) == 200 and bal(bank["id"]) == 899.7
    # Pago con impuesto 0.15%: el banco paga monto + impuesto, la tarjeta baja solo el monto, el impuesto es un gasto
    tax_pay = post(f"/accounts/{card['id']}/pay", {"from_account_id": bank["id"], "amount": 100, "tax_amount": 0.15, "date": "2026-10-03"}, 201).json()
    assert bal(card["id"]) == 100 and bal(bank["id"]) == 799.55
    tax_exp = next(x for x in c.get(f"{API}/expenses", headers=H).json() if x["id"] == tax_pay["tax_expense_id"])
    assert tax_exp["amount"] == 0.15 and tax_exp["category"] == "Impuestos & Tasas"
    assert c.delete(f"{API}/movements/{tax_pay['id']}", headers=H).status_code == 200
    assert bal(card["id"]) == 200 and bal(bank["id"]) == 899.7
    # El pago queda como movimiento editable (la regla solo impide destinos nuevos hacia tarjetas)
    assert c.put(f"{API}/movements/{pay_mov['id']}", json={"amount": 100, "to_account_name": "Visa"}, headers=H).status_code == 200

    # Null explícito no rompe (antes 500); nombre '%' no actúa como comodín
    r = c.put(f"{API}/expenses/{e['id']}", json={"amount": None, "description": "c2"}, headers=H)
    assert r.status_code == 200 and r.json()["amount"] == 300, r.text
    assert post("/expenses", {"account_name": "%", "category": "Comida", "description": "x", "amount": 1, "date": "2026-10-03"}, 201).json()["account_id"] is None

    # Fechas inválidas y montos infinitos rechazados
    post("/expenses", {"category": "C", "description": "x", "amount": 1, "date": "12 oct"}, 422)
    assert c.post(f"{API}/expenses", content='{"category":"C","description":"x","amount":Infinity,"date":"2026-10-01"}',
                  headers={**H, "Content-Type": "application/json"}).status_code == 422

    # Divisas distintas exigen monto recibido
    post("/movements", {"from_account_id": bank["id"], "to_account_id": usd["id"], "amount": 590, "date": "2026-10-04"}, 400)
    post("/movements", {"from_account_id": bank["id"], "to_account_id": usd["id"], "amount": 590, "to_amount": 10, "date": "2026-10-04"}, 201)
    assert bal(usd["id"]) == 10 and bal(bank["id"]) == 309.7

    # Impuesto de traspaso: borrar el gasto del impuesto y luego el traspaso no reembolsa dos veces
    m = post("/movements", {"from_account_id": bank["id"], "to_account_id": usd2["id"], "amount": 100, "tax_amount": 5, "date": "2026-10-05"}, 201).json()
    assert bal(bank["id"]) == 204.7
    assert c.delete(f"{API}/expenses/{m['tax_expense_id']}", headers=H).status_code == 200
    assert c.delete(f"{API}/movements/{m['id']}", headers=H).status_code == 200
    assert bal(bank["id"]) == 309.7 and bal(card["id"]) == 200 and bal(usd2["id"]) == 0

    # Misma cuenta origen/destino rechazada
    post("/movements", {"from_account_id": bank["id"], "to_account_id": bank["id"], "amount": 1, "date": "2026-10-05"}, 400)

    # Deudas: no se puede sobrepagar; borrar el abono restaura el saldo pendiente
    d = post("/debts", {"creditor": "Banco", "total_amount": 100, "remaining_amount": 100}, 201).json()
    post(f"/debts/{d['id']}/pay", {"amount": 150, "account_id": bank["id"]}, 400)
    assert post(f"/debts/{d['id']}/pay", {"amount": 40, "account_id": bank["id"]}, 200).json()["remaining_amount"] == 60
    pay_exp = next(x for x in c.get(f"{API}/expenses", headers=H).json() if x["debt_id"] == d["id"])
    assert pay_exp["date"] == date.today().isoformat()
    c.delete(f"{API}/expenses/{pay_exp['id']}", headers=H)
    assert next(x for x in c.get(f"{API}/debts", headers=H).json() if x["id"] == d["id"])["remaining_amount"] == 100
    assert bal(bank["id"]) == 309.7

    # Presupuesto duplicado por categoría
    post("/budgets", {"category": "Comida", "allocated_amount": 400}, 201)
    post("/budgets", {"category": "comida", "allocated_amount": 100}, 409)

    # Filtro por fechas
    assert all(x["date"] >= "2026-10-02" for x in c.get(f"{API}/expenses?from_date=2026-10-02", headers=H).json())

    # Alertas: presupuesto >= 80% en el periodo actual
    post("/expenses", {"account_id": bank["id"], "category": "Comida", "description": "big", "amount": 350, "date": "hoy"}, 400)  # sin fondos
    post("/expenses", {"account_id": bank["id"], "category": "Comida", "description": "big", "amount": 300, "date": "hoy"}, 201)
    alerts = c.post(f"{API}/notifications/check-alerts", headers=H).json()
    assert any("Presupuesto" in a["title"] for a in alerts), alerts
    assert len(c.post(f"{API}/notifications/check-alerts", headers=H).json()) == len(alerts)  # sin duplicados

print("OK: checks contables pasaron")
