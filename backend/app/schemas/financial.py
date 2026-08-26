from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime


# --- Account Schemas ---
class AccountBase(BaseModel):
    name: str
    type: str = "bank"
    balance: float = 0.0
    currency: str = "USD"
    account_number: Optional[str] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    account_number: Optional[str] = None


class AccountResponse(AccountBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Transaction Schemas (Expenses & Incomes) ---
class TransactionBase(BaseModel):
    description: str
    amount: float
    type: str  # "expense" | "income"
    category: str
    account_name: str
    account_id: Optional[str] = None
    date: str


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    account_name: Optional[str] = None
    account_id: Optional[str] = None
    date: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Budget Schemas ---
class BudgetBase(BaseModel):
    category: str
    allocated_amount: float
    color: str = "bg-zinc-900"


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    allocated_amount: Optional[float] = None
    color: Optional[str] = None


class BudgetResponse(BudgetBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Debt Schemas ---
class DebtBase(BaseModel):
    creditor: str
    type: str
    total_amount: float
    remaining_amount: float
    monthly_payment: float = 0.0
    interest_rate: float = 0.0
    due_date: str = "Fin de mes"


class DebtCreate(DebtBase):
    pass


class DebtUpdate(BaseModel):
    creditor: Optional[str] = None
    type: Optional[str] = None
    total_amount: Optional[float] = None
    remaining_amount: Optional[float] = None
    monthly_payment: Optional[float] = None
    interest_rate: Optional[float] = None
    due_date: Optional[str] = None


class DebtResponse(DebtBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
