import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="bank", nullable=False)  # "bank", "card", "wallet", "cash"
    balance = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    account_number = Column(String(100), nullable=True)

    user = relationship("User", backref="accounts")


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    account_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(String(50), nullable=False)

    user = relationship("User", backref="expenses")
    account = relationship("Account", backref="expenses")


class Income(Base, TimestampMixin):
    __tablename__ = "incomes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    account_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(String(50), nullable=False)

    user = relationship("User", backref="incomes")
    account = relationship("Account", backref="incomes")


class Movement(Base, TimestampMixin):
    """Transferencia de dinero entre dos cuentas (traspasos/movimientos internos)."""
    __tablename__ = "movements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    from_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    from_account_name = Column(String(255), nullable=False)
    to_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    to_account_name = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), default="Traspaso entre cuentas", nullable=False)
    date = Column(String(50), nullable=False)

    user = relationship("User", backref="movements")


class Budget(Base, TimestampMixin):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    allocated_amount = Column(Float, nullable=False)
    color = Column(String(50), default="bg-zinc-900", nullable=False)

    user = relationship("User", backref="budgets")


class Debt(Base, TimestampMixin):
    __tablename__ = "debts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    creditor = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    total_amount = Column(Float, nullable=False)
    remaining_amount = Column(Float, nullable=False)
    monthly_payment = Column(Float, default=0.0, nullable=False)
    interest_rate = Column(Float, default=0.0, nullable=False)
    due_date = Column(String(100), default="Fin de mes", nullable=False)

    user = relationship("User", backref="debts")
