"""Self-check de recurrentes, metas e indicadores. Ejecutar desde backend/: python tests/check_planning.py"""
import os
import sys
import tempfile
from datetime import date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["DATABASE_URL"] = os.environ.get("CHECK_DATABASE_URL") or f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'plan.db')}"
os.environ["DATABASE_POOLER_URL"] = ""

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.models import User  # noqa: E402
from app.services.insights import Tx, add_months, detect_subscriptions, small_expenses, goal_monthly_need  # noqa: E402

# --- Funciones puras ---
assert add_months(date(2026, 1, 31), 1) == date(2026, 2, 28)
d0 = date(2026, 7, 5)
subs = detect_subscriptions(
    [Tx("Netflix", Decimal("650"), d0), Tx("netflix ", Decimal("650"), d0 + timedelta(days=31)),
     Tx("Colmado", Decimal("300"), d0), Tx("Colmado", Decimal("300"), d0 + timedelta(days=3))],
    known=set(),
)
assert [s["description"] for s in subs] == ["netflix"], subs
hormiga = small_expenses([Tx("Café", Decimal("150"), d0), Tx("café", Decimal("150"), d0), Tx("Cena", Decimal("2500"), d0)], Decimal("500"))
assert hormiga["count"] == 2 and hormiga["total"] == 300 and hormiga["top"][0]["count"] == 2
assert goal_monthly_need(Decimal("1200"), Decimal("0"), date(2026, 1, 1) + timedelta(days=360), date(2026, 1, 1)) == Decimal("100.00")

# --- API ---
with TestClient(app) as c:
    db = SessionLocal()
    user = User(email="p@example.com", full_name="P", is_verified=True)
    db.add(user)
    db.commit()
    H = {"Authorization": f"Bearer {create_access_token(user.id)}"}
    db.close()

    def call(method, path, body=None, expect=200):
        r = c.request(method, f"/api/v1{path}", json=body, headers=H)
        assert r.status_code == expect, (path, r.status_code, r.text)
        return r.json()

    bank = call("POST", "/accounts", {"name": "Banco", "type": "bank", "balance": 10000}, 201)
    today = date.today()

    # Recurrente vencido hace 2 meses -> se asientan 3 ocurrencias y next_date avanza
    first = add_months(today, -2)
    rec = call("POST", "/recurring", {"kind": "expense", "description": "Alquiler", "category": "Vivienda",
                                       "amount": 1000, "account_name": "banco", "frequency": "monthly", "next_date": first.isoformat()}, 201)
    assert rec["account_id"] == bank["id"]
    res = call("POST", "/recurring/post-due")
    assert res["posted"] == 3 and res["skipped"] == [], res
    assert call("GET", "/recurring")[0]["next_date"] == add_months(first, 3).isoformat()
    assert call("POST", "/recurring/post-due")["posted"] == 0  # idempotente
    assert next(a for a in call("GET", "/accounts") if a["id"] == bank["id"])["balance"] == 7000

    # Sin fondos: se omite sin dejar saldo a medias
    call("POST", "/recurring", {"kind": "expense", "description": "Carro", "category": "Transporte",
                                "amount": 99999, "account_id": bank["id"], "frequency": "monthly", "next_date": today.isoformat()}, 201)
    res = call("POST", "/recurring/post-due")
    assert res["posted"] == 0 and len(res["skipped"]) == 1, res
    assert next(a for a in call("GET", "/accounts") if a["id"] == bank["id"])["balance"] == 7000

    # Metas: aporte y retiro no negativo
    goal = call("POST", "/goals", {"name": "Viaje", "target_amount": 1200, "target_date": add_months(today, 12).isoformat()}, 201)
    assert call("POST", f"/goals/{goal['id']}/contribute", {"amount": 200})["saved_amount"] == 200
    call("POST", f"/goals/{goal['id']}/contribute", {"amount": -500}, 400)

    # Indicadores
    for _ in range(3):
        call("POST", "/expenses", {"account_id": bank["id"], "category": "Comida", "description": "Café", "amount": 120, "date": "hoy"}, 201)
    ins = call("GET", "/insights")
    assert ins["currency"] == "DOP"
    assert ins["small_expenses"]["count"] == 3 and ins["small_expenses"]["top"][0]["description"] == "Café"
    assert any(s["description"] == "Alquiler" and s["source"] == "recurring" for s in ins["subscriptions"])
    assert ins["available_to_spend"] <= 7000 - 360 and ins["daily_allowance"] >= 0
    assert 0 <= ins["peace_score"] <= 100

    # Reset borra también recurrentes y metas
    call("POST", "/reset-data")
    assert call("GET", "/recurring") == [] and call("GET", "/goals") == []

print("OK: checks de planificación pasaron")
