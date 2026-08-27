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
    type = Column(String(50), default="bank", nullable=False)  # "bank", "credit_card", "debit_card", "card", "wallet", "cash", "savings"
    balance = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    account_number = Column(String(100), nullable=True)  # Número de cuenta para bancos
    card_number = Column(String(100), nullable=True)     # Número de tarjeta para crédito / débito
    cutoff_day = Column(Float, nullable=True)            # Día de corte (ej. 15)
    grace_days = Column(Float, nullable=True)            # Días de gracia para pago (ej. 20)
    overdraft_limit = Column(Float, default=0.0, nullable=True)  # Monto de sobregiro / Límite de crédito

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
    """Transferencia de dinero entre dos cuentas (traspasos/movimientos internos) con soporte de impuesto/comisión."""
    __tablename__ = "movements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    from_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    from_account_name = Column(String(255), nullable=False)
    to_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    to_account_name = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    tax_expense_id = Column(String(36), ForeignKey("expenses.id", ondelete="SET NULL"), nullable=True)
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


class EmailIntegration(Base, TimestampMixin):
    """Configuración de conexión con Google Gmail para escaneo de transacciones bancarias."""
    __tablename__ = "email_integrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    provider = Column(String(50), default="google", nullable=False)
    email = Column(String(255), nullable=False)
    access_token = Column(String(1000), nullable=True)
    refresh_token = Column(String(1000), nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    is_active = Column(String(10), default="true", nullable=False)  # "true" | "false"
    last_synced_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="email_integration")


class PendingNotification(Base, TimestampMixin):
    """Notificación con borrador detectado desde correo bancario pendiente de confirmación."""
    __tablename__ = "pending_notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    source = Column(String(50), default="gmail", nullable=False)
    target_type = Column(String(50), default="expense", nullable=False)  # "expense" | "income" | "movement"
    draft_data = Column(String(2000), nullable=False)  # JSON string con datos precargados
    is_read = Column(String(10), default="false", nullable=False)  # "true" | "false"
    is_processed = Column(String(10), default="false", nullable=False)  # "true" | "false"
    email_message_id = Column(String(255), nullable=True, index=True)

    user = relationship("User", backref="notifications")
