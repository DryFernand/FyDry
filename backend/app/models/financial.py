import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Integer, Boolean, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

# Dinero: decimal exacto con 2 decimales (hasta 999,999,999,999.99)
Money = Numeric(14, 2, asdecimal=True)


class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="bank", nullable=False)  # "bank", "credit_card", "debit_card", "card", "wallet", "cash", "savings"
    # Tarjeta de crédito: saldo CONSUMIDO (deuda, positivo). Resto de cuentas: saldo disponible.
    balance = Column(Money, default=0, nullable=False)
    currency = Column(String(10), default="DOP", nullable=False)
    account_number = Column(String(100), nullable=True)  # Número de cuenta para bancos
    card_number = Column(String(100), nullable=True)     # Número de tarjeta para crédito / débito
    cutoff_day = Column(Integer, nullable=True)          # Día de corte (1-31)
    grace_days = Column(Integer, nullable=True)          # Días de gracia para pago
    overdraft_limit = Column(Money, default=0, nullable=True)  # Monto de sobregiro
    credit_limit = Column(Money, default=0, nullable=True)     # Límite total de crédito de la tarjeta
    min_balance = Column(Money, default=0, nullable=True)      # Saldo mínimo aceptado para alertas

    user = relationship("User", backref="accounts")


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"
    __table_args__ = (Index("ix_expenses_user_date", "user_id", "date"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    account_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Money, nullable=False)
    date = Column(Date, nullable=False)
    # Si el gasto es un abono a deuda, enlace para revertir el saldo pendiente al eliminarlo
    debt_id = Column(String(36), ForeignKey("debts.id", ondelete="SET NULL"), nullable=True, index=True)

    user = relationship("User", backref="expenses")
    account = relationship("Account", backref="expenses")


class Income(Base, TimestampMixin):
    __tablename__ = "incomes"
    __table_args__ = (Index("ix_incomes_user_date", "user_id", "date"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    account_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Money, nullable=False)
    date = Column(Date, nullable=False)

    user = relationship("User", backref="incomes")
    account = relationship("Account", backref="incomes")


class Movement(Base, TimestampMixin):
    """Transferencia de dinero entre dos cuentas (traspasos/movimientos internos) con soporte de impuesto/comisión."""
    __tablename__ = "movements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    from_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    from_account_name = Column(String(255), nullable=False)
    to_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    to_account_name = Column(String(255), nullable=False)
    amount = Column(Money, nullable=False)
    # Monto acreditado en destino cuando las monedas difieren (ej. compra de dólares). Null = mismo monto.
    to_amount = Column(Money, nullable=True)
    tax_amount = Column(Money, default=0, nullable=False)
    tax_expense_id = Column(String(36), ForeignKey("expenses.id", ondelete="SET NULL"), nullable=True)
    description = Column(String(255), default="Traspaso entre cuentas", nullable=False)
    date = Column(Date, nullable=False)

    user = relationship("User", backref="movements")


class Budget(Base, TimestampMixin):
    """Límite mensual por categoría. El periodo arranca en UserProfile.budget_reset_day."""
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    allocated_amount = Column(Money, nullable=False)
    color = Column(String(50), default="bg-zinc-900", nullable=False)

    user = relationship("User", backref="budgets")


class Debt(Base, TimestampMixin):
    __tablename__ = "debts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    creditor = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    total_amount = Column(Money, nullable=False)
    remaining_amount = Column(Money, nullable=False)
    monthly_payment = Column(Money, default=0, nullable=False)
    interest_rate = Column(Numeric(7, 3), default=0, nullable=False)
    due_date = Column(String(100), default="Fin de mes", nullable=False)

    user = relationship("User", backref="debts")


class EmailIntegration(Base, TimestampMixin):
    """Configuración de conexión con Google Gmail para escaneo de transacciones bancarias."""
    __tablename__ = "email_integrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    provider = Column(String(50), default="google", nullable=False)
    email = Column(String(255), nullable=False)
    token_expiry = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_synced_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="email_integration")


class PendingNotification(Base, TimestampMixin):
    """Notificación de sistema (alertas) o borrador pendiente de confirmación."""
    __tablename__ = "pending_notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    source = Column(String(50), default="gmail", nullable=False)
    target_type = Column(String(50), default="expense", nullable=False)  # "expense" | "income" | "movement" | "account" | "budget"
    draft_data = Column(String(2000), nullable=False)  # JSON string con datos precargados
    is_read = Column(Boolean, default=False, nullable=False)
    is_processed = Column(Boolean, default=False, nullable=False)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    email_message_id = Column(String(255), nullable=True, index=True)

    user = relationship("User", backref="notifications")
