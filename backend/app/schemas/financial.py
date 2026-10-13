import re
from datetime import date as Date, datetime, timedelta
from typing import Annotated, Optional
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

MAX_AMOUNT = 999_999_999_999


def parse_flexible_date(value):
    """Acepta 'YYYY-MM-DD', ISO con hora, 'DD/MM/YYYY', 'hoy'/'ayer' o date. Vacío -> hoy."""
    if value is None or isinstance(value, Date):
        return value
    text = str(value).strip().lower()
    if text in ("", "hoy", "today"):
        return Date.today()
    if text in ("ayer", "yesterday"):
        return Date.today() - timedelta(days=1)
    if re.match(r"^\d{4}-\d{2}-\d{2}", text):
        return Date.fromisoformat(text[:10])
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", text)
    if m:
        return Date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    raise ValueError("Fecha inválida. Usa el formato AAAA-MM-DD.")


FlexDate = Annotated[Date, BeforeValidator(parse_flexible_date)]
PositiveAmount = Annotated[float, Field(gt=0, le=MAX_AMOUNT, allow_inf_nan=False)]
NonNegAmount = Annotated[float, Field(ge=0, le=MAX_AMOUNT, allow_inf_nan=False)]
SignedAmount = Annotated[float, Field(ge=-MAX_AMOUNT, le=MAX_AMOUNT, allow_inf_nan=False)]
Name = Annotated[str, Field(min_length=1, max_length=255)]
Category = Annotated[str, Field(min_length=1, max_length=100)]
Currency = Annotated[str, BeforeValidator(lambda v: str(v).strip().upper() if v is not None else v), Field(pattern=r"^[A-Z]{3}$")]
ACCOUNT_TYPES = {"bank", "credit_card", "debit_card", "card", "wallet", "cash", "savings"}
_ACCOUNT_TYPE_ALIASES = {
    "banco": "bank", "efectivo": "cash", "ahorro": "savings", "ahorros": "savings",
    "billetera": "wallet", "tarjeta de credito": "credit_card", "tarjeta de crédito": "credit_card",
    "credito": "credit_card", "crédito": "credit_card", "tarjeta de debito": "debit_card",
    "tarjeta de débito": "debit_card", "debito": "debit_card", "débito": "debit_card",
}


def normalize_account_type(value):
    """Normaliza tipos (incluye sinónimos en español). Desconocido -> 'bank'."""
    if value is None:
        return value
    text = str(value).strip().lower()
    if text in ACCOUNT_TYPES:
        return text
    return _ACCOUNT_TYPE_ALIASES.get(text, "bank")


AccountType = Annotated[str, BeforeValidator(normalize_account_type)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ACCOUNTS
# ==========================================
class AccountCreate(BaseModel):
    name: Name
    type: AccountType = "bank"
    balance: SignedAmount = 0.0
    currency: Currency = "DOP"
    account_number: Optional[str] = Field(None, max_length=100)
    card_number: Optional[str] = Field(None, max_length=100)
    cutoff_day: Optional[int] = Field(None, ge=1, le=31)
    grace_days: Optional[int] = Field(None, ge=0, le=60)
    overdraft_limit: Optional[NonNegAmount] = 0.0
    credit_limit: Optional[NonNegAmount] = 0.0
    min_balance: Optional[NonNegAmount] = 0.0


class AccountUpdate(BaseModel):
    name: Optional[Name] = None
    type: Optional[AccountType] = None
    balance: Optional[SignedAmount] = None
    currency: Optional[Currency] = None
    account_number: Optional[str] = Field(None, max_length=100)
    card_number: Optional[str] = Field(None, max_length=100)
    cutoff_day: Optional[int] = Field(None, ge=1, le=31)
    grace_days: Optional[int] = Field(None, ge=0, le=60)
    overdraft_limit: Optional[NonNegAmount] = None
    credit_limit: Optional[NonNegAmount] = None
    min_balance: Optional[NonNegAmount] = None


class AccountResponse(ORMModel):
    id: str
    name: str
    type: str
    balance: float
    currency: str
    account_number: Optional[str] = None
    card_number: Optional[str] = None
    cutoff_day: Optional[int] = None
    grace_days: Optional[int] = None
    overdraft_limit: Optional[float] = 0.0
    credit_limit: Optional[float] = 0.0
    min_balance: Optional[float] = 0.0


# ==========================================
# EXPENSES (Gastos)
# ==========================================
class ExpenseCreate(BaseModel):
    account_id: Optional[str] = Field(None, max_length=36)
    account_name: Optional[str] = Field(None, max_length=255)
    category: Category
    description: Name
    amount: PositiveAmount
    date: FlexDate


class ExpenseUpdate(BaseModel):
    account_id: Optional[str] = Field(None, max_length=36)
    account_name: Optional[str] = Field(None, max_length=255)
    category: Optional[Category] = None
    description: Optional[Name] = None
    amount: Optional[PositiveAmount] = None
    date: Optional[FlexDate] = None


class ExpenseResponse(ORMModel):
    id: str
    account_id: Optional[str] = None
    account_name: str
    category: str
    description: str
    amount: float
    date: Date
    debt_id: Optional[str] = None
    created_at: Optional[datetime] = None


# ==========================================
# INCOMES (Ingresos)
# ==========================================
class IncomeCreate(BaseModel):
    account_id: Optional[str] = Field(None, max_length=36)
    account_name: Optional[str] = Field(None, max_length=255)
    category: Category
    description: Name
    amount: PositiveAmount
    date: FlexDate


class IncomeUpdate(BaseModel):
    account_id: Optional[str] = Field(None, max_length=36)
    account_name: Optional[str] = Field(None, max_length=255)
    category: Optional[Category] = None
    description: Optional[Name] = None
    amount: Optional[PositiveAmount] = None
    date: Optional[FlexDate] = None


class IncomeResponse(ORMModel):
    id: str
    account_id: Optional[str] = None
    account_name: str
    category: str
    description: str
    amount: float
    date: Date
    created_at: Optional[datetime] = None


# ==========================================
# MOVEMENTS (Transferencias entre Cuentas)
# ==========================================
class MovementCreate(BaseModel):
    from_account_id: Optional[str] = Field(None, max_length=36)
    from_account_name: Optional[str] = Field(None, max_length=255)
    to_account_id: Optional[str] = Field(None, max_length=36)
    to_account_name: Optional[str] = Field(None, max_length=255)
    amount: PositiveAmount
    to_amount: Optional[PositiveAmount] = None
    tax_amount: Optional[NonNegAmount] = 0.0
    description: Optional[str] = Field("Traspaso entre cuentas", max_length=255)
    date: FlexDate


class MovementUpdate(BaseModel):
    from_account_id: Optional[str] = Field(None, max_length=36)
    from_account_name: Optional[str] = Field(None, max_length=255)
    to_account_id: Optional[str] = Field(None, max_length=36)
    to_account_name: Optional[str] = Field(None, max_length=255)
    amount: Optional[PositiveAmount] = None
    to_amount: Optional[PositiveAmount] = None
    tax_amount: Optional[NonNegAmount] = None
    description: Optional[str] = Field(None, max_length=255)
    date: Optional[FlexDate] = None


class MovementResponse(ORMModel):
    id: str
    from_account_id: Optional[str] = None
    from_account_name: str
    to_account_id: Optional[str] = None
    to_account_name: str
    amount: float
    to_amount: Optional[float] = None
    tax_amount: float = 0.0
    tax_expense_id: Optional[str] = None
    description: str
    date: Date
    created_at: Optional[datetime] = None


class CardPaymentRequest(BaseModel):
    """Pago a una tarjeta de crédito desde otra cuenta (única forma de reducir su consumo)."""
    from_account_id: Optional[str] = Field(None, max_length=36)
    from_account_name: Optional[str] = Field(None, max_length=255)
    amount: PositiveAmount
    # Impuesto/comisión que cobra el banco al transferir (ej. 0.15% DGII); lo paga la cuenta de origen
    tax_amount: Optional[NonNegAmount] = 0.0
    date: Optional[FlexDate] = None
    description: Optional[str] = Field(None, max_length=255)


# ==========================================
# BUDGETS
# ==========================================
class BudgetCreate(BaseModel):
    category: Category
    allocated_amount: PositiveAmount
    color: Optional[str] = Field("bg-zinc-900", max_length=50)


class BudgetUpdate(BaseModel):
    category: Optional[Category] = None
    allocated_amount: Optional[PositiveAmount] = None
    color: Optional[str] = Field(None, max_length=50)


class BudgetResponse(ORMModel):
    id: str
    category: str
    allocated_amount: float
    color: str


# ==========================================
# DEBTS
# ==========================================
class DebtCreate(BaseModel):
    creditor: Name
    type: str = Field("Préstamo Personal", min_length=1, max_length=100)
    total_amount: PositiveAmount
    remaining_amount: NonNegAmount
    monthly_payment: NonNegAmount = 0.0
    interest_rate: float = Field(0.0, ge=0, le=1000, allow_inf_nan=False)
    due_date: str = Field("Fin de mes", max_length=100)


class DebtUpdate(BaseModel):
    creditor: Optional[Name] = None
    type: Optional[str] = Field(None, min_length=1, max_length=100)
    total_amount: Optional[PositiveAmount] = None
    remaining_amount: Optional[NonNegAmount] = None
    monthly_payment: Optional[NonNegAmount] = None
    interest_rate: Optional[float] = Field(None, ge=0, le=1000, allow_inf_nan=False)
    due_date: Optional[str] = Field(None, max_length=100)


class DebtResponse(ORMModel):
    id: str
    creditor: str
    type: str
    total_amount: float
    remaining_amount: float
    monthly_payment: float
    interest_rate: float
    due_date: str


class DebtPaymentRequest(BaseModel):
    amount: PositiveAmount
    account_id: Optional[str] = Field(None, max_length=36)
    account_name: Optional[str] = Field(None, max_length=255)
    date: Optional[FlexDate] = None
    description: Optional[str] = Field(None, max_length=255)


# ==========================================
# EMAIL SYNC & NOTIFICATIONS
# ==========================================
class EmailIntegrationResponse(ORMModel):
    id: str
    provider: str
    email: str
    is_active: bool
    last_synced_at: Optional[datetime] = None


class EmailSyncConnectRequest(BaseModel):
    email: str = Field(..., max_length=255)


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    source: str
    target_type: str
    draft_data: dict
    is_read: bool
    is_processed: bool
    created_at: Optional[datetime] = None


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_processed: Optional[bool] = None


class EmailScanResult(BaseModel):
    scanned_count: int
    new_found: int
    message: str
