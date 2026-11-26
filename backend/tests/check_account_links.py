"""Self-check: un gasto o ingreso nunca queda sin afectar la cuenta. Ejecutar desde backend/: python tests/check_account_links.py"""
import importlib.util
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["DATABASE_URL"] = os.environ.get("CHECK_DATABASE_URL") or f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'links.db')}"
os.environ["DATABASE_POOLER_URL"] = ""

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402
from app.main import app  # noqa: E402
from app.core.database import SessionLocal, engine  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.models import User  # noqa: E402

API = "/api/v1"


def make_user(email):
    db = SessionLocal()
    u = User(email=email, full_name="L", is_verified=True)
    db.add(u)
    db.commit()
    headers = {"Authorization": f"Bearer {create_access_token(u.id)}"}
    db.close()
    return headers


with TestClient(app) as c:
    H = make_user("links@example.com")

    def req(method, path, body=None, expect=None, headers=H):
        r = c.request(method, f"{API}{path}", json=body, headers=headers)
        if expect:
            assert r.status_code == expect, (method, path, r.status_code, r.text)
        return r.json()

    def bal(acc_id):
        return next(a["balance"] for a in req("GET", "/accounts") if a["id"] == acc_id)

    bank = req("POST", "/accounts", {"name": "BHD", "type": "bank", "balance": 1000}, 201)
    exp = {"category": "Otros Gastos", "description": "cena", "amount": 200, "date": "2026-11-20"}

    # 1. Cuenta inexistente: error claro en vez de guardar el gasto/ingreso sin tocar saldos
    err = req("POST", "/expenses", {**exp, "account_name": "BHD Ahorro"}, 400)
    assert "no existe" in err["detail"], err
    req("POST", "/incomes", {**exp, "category": "Otros Ingresos", "account_name": "Nada"}, 400)
    assert bal(bank["id"]) == 1000 and req("GET", "/expenses") == []

    # 2. Renombrar la cuenta actualiza el nombre en sus gastos; editar un gasto viejo no lo desvincula
    g = req("POST", "/expenses", {**exp, "account_name": "BHD"}, 201)
    assert bal(bank["id"]) == 800
    req("PUT", f"/accounts/{bank['id']}", {"name": "BHD Nómina"}, 200)
    assert req("GET", "/expenses")[0]["account_name"] == "BHD Nómina"
    r = req("PUT", f"/expenses/{g['id']}", {**exp, "description": "cena familiar", "account_id": bank["id"], "account_name": "BHD"}, 200)
    assert r["account_id"] == bank["id"] and bal(bank["id"]) == 800, (r, bal(bank["id"]))
    # Sin id y con un nombre que ya no existe: error, y el saldo no cambia
    req("PUT", f"/expenses/{g['id']}", {**exp, "account_name": "BHD"}, 400)
    assert bal(bank["id"]) == 800

    # 3. Usuario sin ninguna cuenta: el gasto se registra sin cuenta, como antes
    H2 = make_user("nocuentas@example.com")
    assert req("POST", "/expenses", {**exp, "account_name": "Efectivo"}, 201, headers=H2)["account_id"] is None

    # 4. La migración 0007 corrige los nombres viejos que ya hay en la base
    with engine.begin() as conn:
        conn.execute(text("UPDATE expenses SET account_name = 'Nombre viejo' WHERE id = :id"), {"id": g["id"]})
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "alembic", "versions", "0007_sync_account_names.py")
    spec = importlib.util.spec_from_file_location("m0007", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    with engine.begin() as conn:
        migration.op = type("Op", (), {"execute": staticmethod(lambda sql: conn.execute(text(sql)))})
        migration.upgrade()
    assert req("GET", "/expenses")[0]["account_name"] == "BHD Nómina"

print("OK: checks de vínculo gasto-cuenta pasaron")
