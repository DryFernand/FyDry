"""Self-check del onboarding: deja la app configurada. Ejecutar desde backend/: python tests/check_onboarding.py"""
import os
import sys
import tempfile
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["DATABASE_URL"] = os.environ.get("CHECK_DATABASE_URL") or f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'onb.db')}"
os.environ["DATABASE_POOLER_URL"] = ""

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.models import User  # noqa: E402
from app.api.v1.endpoints.onboarding import _next_on_day  # noqa: E402

API = "/api/v1"

# Próximo día del mes: siempre después de hoy y ajustado a meses cortos
assert _next_on_day(date(2026, 1, 10), 15) == date(2026, 1, 15)
assert _next_on_day(date(2026, 1, 15), 15) == date(2026, 2, 15)
assert _next_on_day(date(2026, 1, 31), 31) == date(2026, 2, 28)

BASE = {
    "country": "República Dominicana", "preferred_currency": "DOP", "employment_type": "employed",
    "monthly_income_range": "25k_60k", "income_frequency": "biweekly", "financial_situation_status": "living_paycheck",
    "primary_goals": ["emergency_fund"], "referral_source": "friend",
}

with TestClient(app) as c:
    db = SessionLocal()
    user = User(email="o@example.com", full_name="O", is_verified=True)
    db.add(user)
    db.commit()
    H = {"Authorization": f"Bearer {create_access_token(user.id)}"}
    db.close()

    def get(path):
        return c.get(f"{API}{path}", headers=H).json()

    # Datos inválidos se rechazan sin dejar nada a medias
    bad = {**BASE, "pay_day": 40}
    assert c.post(f"{API}/onboarding/complete", json=bad, headers=H).status_code == 422
    assert get("/accounts") == []

    payload = {
        **BASE,
        "pay_day": 15,
        "accounts": [
            {"name": "BHD Nómina", "type": "bank", "balance": 30000, "currency": "DOP"},
            {"name": "Visa Popular", "type": "credit_card", "balance": 5000, "credit_limit": 50000,
             "cutoff_day": 5, "payment_day": 28, "currency": "DOP"},
        ],
        "fixed_expenses": [
            {"description": "Alquiler", "amount": 18000, "day": 1, "category": "Vivienda & Alquiler"},
            {"description": "Internet", "amount": 2000, "day": 20, "category": "Telefonía & Internet"},
        ],
        "emergency_months": 3,
    }
    r = c.post(f"{API}/onboarding/complete", json=payload, headers=H)
    assert r.status_code == 200 and r.json()["onboarding_completed"], r.text

    accounts = {a["name"]: a for a in get("/accounts")}
    assert accounts["BHD Nómina"]["balance"] == 30000
    visa = accounts["Visa Popular"]
    assert visa["cutoff_day"] == 5 and visa["grace_days"] == 23 and visa["credit_limit"] == 50000

    recurring = get("/recurring")
    assert sorted(x["description"] for x in recurring) == ["Alquiler", "Internet"]
    assert all(x["account_name"] == "BHD Nómina" and x["frequency"] == "monthly" for x in recurring)
    assert all(date.fromisoformat(x["next_date"]) > date.today() for x in recurring)

    goals = get("/goals")
    assert len(goals) == 1 and goals[0]["name"] == "Fondo de emergencia" and goals[0]["target_amount"] == 60000

    settings = get("/auth/settings")
    assert settings["budget_reset_day"] == 15 and settings["income_frequency"] == "biweekly"
    assert settings["primary_goals"] == ["emergency_fund"]

    # Repetir el onboarding actualiza el perfil pero no duplica cuentas, gastos fijos ni metas
    assert c.post(f"{API}/onboarding/complete", json=payload, headers=H).status_code == 200
    assert len(get("/accounts")) == 2 and len(get("/recurring")) == 2 and len(get("/goals")) == 1

print("OK: checks de onboarding pasaron")
