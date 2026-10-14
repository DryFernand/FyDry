"""Self-check del historial de la calculadora y la tasa DGII. Ejecutar desde backend/: python tests/check_planner.py"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["DATABASE_URL"] = os.environ.get("CHECK_DATABASE_URL") or f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'planner.db')}"
os.environ["DATABASE_POOLER_URL"] = ""
os.environ["ENVIRONMENT"] = "development"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.models import User, Account  # noqa: E402

with TestClient(app) as c:
    db = SessionLocal()
    user = User(email="plan@example.com", full_name="P", is_verified=True)
    other = User(email="otro@example.com", full_name="O", is_verified=True)
    db.add_all([user, other])
    db.commit()
    H = {"Authorization": f"Bearer {create_access_token(user.id)}"}
    H2 = {"Authorization": f"Bearer {create_access_token(other.id)}"}
    db.close()

    # Tasa DGII: por defecto 0.15%, editable, con límite
    assert c.get("/api/v1/auth/settings", headers=H).json()["transfer_tax_rate"] == 0.0015
    assert c.put("/api/v1/auth/settings", json={"transfer_tax_rate": 0.002}, headers=H).json()["transfer_tax_rate"] == 0.002
    assert c.put("/api/v1/auth/settings", json={"transfer_tax_rate": 0.5}, headers=H).status_code == 422

    # Historial: guardar, listar, editar, aislado por usuario, borrar
    plan = {"incomes": [{"label": "Quincena", "amount": 30000}], "summary": {"total_income": 30000, "final_total": 9965.5}}
    r = c.post("/api/v1/planner", json={"name": "Quincena 15 oct 2026", "data": plan}, headers=H)
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    listed = c.get("/api/v1/planner", headers=H).json()
    assert len(listed) == 1 and listed[0]["summary"]["final_total"] == 9965.5 and "data" not in listed[0]
    assert c.get(f"/api/v1/planner/{pid}", headers=H).json()["data"]["incomes"][0]["amount"] == 30000
    assert c.put(f"/api/v1/planner/{pid}", json={"name": "Editado", "data": plan}, headers=H).json()["name"] == "Editado"
    assert c.get(f"/api/v1/planner/{pid}", headers=H2).status_code == 404
    assert c.post("/api/v1/planner", json={"name": "x", "data": {"big": "a" * 120_000}}, headers=H).status_code == 413

    # No toca datos financieros: no crea cuentas ni movimientos
    db = SessionLocal()
    assert db.query(Account).count() == 0
    db.close()
    assert c.delete(f"/api/v1/planner/{pid}", headers=H).status_code == 200
    assert c.get("/api/v1/planner", headers=H).json() == []

print("OK: checks de la calculadora pasaron")
