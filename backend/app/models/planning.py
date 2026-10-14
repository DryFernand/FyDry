import uuid
from sqlalchemy import Column, String, Boolean, Date, ForeignKey, Text
from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.financial import Money


class RecurringTransaction(Base, TimestampMixin):
    """Gasto o ingreso que se repite (alquiler, Netflix, salario). Se asienta automáticamente al llegar next_date."""
    __tablename__ = "recurring_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(10), nullable=False)  # "expense" | "income"
    description = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Money, nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    account_name = Column(String(255), nullable=True)
    frequency = Column(String(20), nullable=False)  # "weekly" | "biweekly" | "monthly" | "yearly"
    next_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class SavingsGoal(Base, TimestampMixin):
    """Meta de ahorro con monto objetivo y fecha opcional."""
    __tablename__ = "savings_goals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    target_amount = Column(Money, nullable=False)
    saved_amount = Column(Money, default=0, nullable=False)
    target_date = Column(Date, nullable=True)
    color = Column(String(50), default="bg-emerald-500", nullable=False)


class PlannerSnapshot(Base, TimestampMixin):
    """Planificación de quincena guardada (calculadora). No afecta cuentas ni transacciones reales."""
    __tablename__ = "planner_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    data = Column(Text, nullable=False)  # JSON del plan (ingresos, cuentas, gastos, transferencias y resumen)
