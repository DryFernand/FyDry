from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


# ==========================================
# ACCOUNTS
# ==========================================
class AccountCreate(BaseModel):
    name: str
    type: str = "bank"  # "bank", "credit_card", "debit_card", "card", "wallet", "cash", "savings"
    balance: float = 0.0
    currency: str = "USD"
    account_number: Optional[str] = None
    card_number: Optional[str] = None
    cutoff_day: Optional[float] = None
    grace_days: Optional[float] = None
    overdraft_limit: Optional[float] = 0.0
    credit_limit: Optional[float] = 0.0
    min_balance: Optional[float] = 0.0


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    account_number: Optional[str] = None
    card_number: Optional[str] = None
    cutoff_day: Optional[float] = None
    grace_days: Optional[float] = None
    overdraft_limit: Optional[float] = None
    credit_limit: Optional[float] = None
    min_balance: Optional[float] = None


class AccountResponse(BaseModel):
    id: str
    name: str
    type: str
    balance: float
    currency: str
    account_number: Optional[str] = None
    card_number: Optional[str] = None
    cutoff_day: Optional[float] = None
    grace_days: Optional[float] = None
    overdraft_limit: Optional[float] = 0.0
    credit_limit: Optional[float] = 0.0
    min_balance: Optional[float] = 0.0

    class Config:
        from_attributes = True


# ==========================================
# EXPENSES (Gastos)
# ==========================================
class ExpenseCreate(BaseModel):
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    category: str
    description: str
    amount: float
    date: str


class ExpenseUpdate(BaseModel):
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: str
    account_id: Optional[str] = None
    account_name: str
    category: str
    description: str
    amount: float
    date: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# INCOMES (Ingresos)
# ==========================================
class IncomeCreate(BaseModel):
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    category: str
    description: str
    amount: float
    date: str


class IncomeUpdate(BaseModel):
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None


class IncomeResponse(BaseModel):
    id: str
    account_id: Optional[str] = None
    account_name: str
    category: str
    description: str
    amount: float
    date: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# MOVEMENTS (Transferencias entre Cuentas)
# ==========================================
class MovementCreate(BaseModel):
    from_account_id: Optional[str] = None
    from_account_name: Optional[str] = None
    to_account_id: Optional[str] = None
    to_account_name: Optional[str] = None
    amount: float
    tax_amount: Optional[float] = 0.0
    description: Optional[str] = "Traspaso entre cuentas"
    date: str


class MovementUpdate(BaseModel):
    from_account_id: Optional[str] = None
    from_account_name: Optional[str] = None
    to_account_id: Optional[str] = None
    to_account_name: Optional[str] = None
    amount: Optional[float] = None
    tax_amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None


class MovementResponse(BaseModel):
    id: str
    from_account_id: Optional[str] = None
    from_account_name: str
    to_account_id: Optional[str] = None
    to_account_name: str
    amount: float
    tax_amount: float = 0.0
    tax_expense_id: Optional[str] = None
    description: str
    date: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# BUDGETS
# ==========================================
class BudgetCreate(BaseModel):
    category: str
    allocated_amount: float
    color: Optional[str] = "bg-zinc-900"


class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    allocated_amount: Optional[float] = None
    color: Optional[str] = None


class BudgetResponse(BaseModel):
    id: str
    category: str
    allocated_amount: float
    color: str

    class Config:
        from_attributes = True


# ==========================================
# DEBTS
# ==========================================
class DebtCreate(BaseModel):
    creditor: str
    type: str = "Préstamo Personal"
    total_amount: float
    remaining_amount: float
    monthly_payment: float = 0.0
    interest_rate: float = 0.0
    due_date: str = "Fin de mes"


class DebtUpdate(BaseModel):
    creditor: Optional[str] = None
    type: Optional[str] = None
    total_amount: Optional[float] = None
    remaining_amount: Optional[float] = None
    monthly_payment: Optional[float] = None
    interest_rate: Optional[float] = None
    due_date: Optional[str] = None


class DebtResponse(BaseModel):
    id: str
    creditor: str
    type: str
    total_amount: float
    remaining_amount: float
    monthly_payment: float
    interest_rate: float
    due_date: str

    class Config:
        from_attributes = True


class DebtPaymentRequest(BaseModel):
    amount: float
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None


# ==========================================
# EMAIL SYNC & NOTIFICATIONS
# ==========================================
class EmailIntegrationResponse(BaseModel):
    id: str
    provider: str
    email: str
    is_active: bool
    last_synced_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailSyncConnectRequest(BaseModel):
    email: str
    code: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None


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

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_processed: Optional[bool] = None


class EmailScanResult(BaseModel):
    scanned_count: int
    new_found: int
    message: str
