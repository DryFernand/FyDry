from datetime import date as Date
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

from app.schemas.financial import ORMModel, FlexDate, PositiveAmount, Name, Category, MAX_AMOUNT

Frequency = Literal["weekly", "biweekly", "monthly", "yearly"]


class RecurringCreate(BaseModel):
    kind: Literal["expense", "income"]
    description: Name
    category: Category
    amount: PositiveAmount
    account_id: Optional[str] = Field(None, max_length=36)
    account_name: Optional[str] = Field(None, max_length=255)
    frequency: Frequency = "monthly"
    next_date: FlexDate
    is_active: bool = True


class RecurringUpdate(BaseModel):
    kind: Optional[Literal["expense", "income"]] = None
    description: Optional[Name] = None
    category: Optional[Category] = None
    amount: Optional[PositiveAmount] = None
    account_id: Optional[str] = Field(None, max_length=36)
    account_name: Optional[str] = Field(None, max_length=255)
    frequency: Optional[Frequency] = None
    next_date: Optional[FlexDate] = None
    is_active: Optional[bool] = None


class RecurringResponse(ORMModel):
    id: str
    kind: str
    description: str
    category: str
    amount: float
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    frequency: str
    next_date: Date
    is_active: bool


class PostDueResult(BaseModel):
    posted: int
    skipped: List[str]


class GoalCreate(BaseModel):
    name: Name
    target_amount: PositiveAmount
    target_date: Optional[FlexDate] = None
    color: Optional[str] = Field("bg-emerald-500", max_length=50)


class GoalUpdate(BaseModel):
    name: Optional[Name] = None
    target_amount: Optional[PositiveAmount] = None
    target_date: Optional[FlexDate] = None
    color: Optional[str] = Field(None, max_length=50)


class GoalContribution(BaseModel):
    """Positivo = aporte, negativo = retiro."""
    amount: float = Field(..., ge=-MAX_AMOUNT, le=MAX_AMOUNT, allow_inf_nan=False)


class GoalResponse(ORMModel):
    id: str
    name: str
    target_amount: float
    saved_amount: float
    target_date: Optional[Date] = None
    color: str


class SmallExpenseGroup(BaseModel):
    description: str
    count: int
    total: float


class SmallExpenses(BaseModel):
    threshold: float
    count: int
    total: float
    top: List[SmallExpenseGroup]


class SubscriptionItem(BaseModel):
    description: str
    amount: float
    frequency: str
    last_date: Optional[Date] = None
    source: Literal["recurring", "detected"]


class InsightsResponse(BaseModel):
    currency: str
    period_start: Date
    period_end: Date
    days_left: int
    income_period: float
    expenses_period: float
    fixed_pending: float
    goals_monthly_need: float
    available_to_spend: float
    daily_allowance: float
    peace_score: int
    small_expenses: SmallExpenses
    subscriptions: List[SubscriptionItem]
