from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas import CoreSchema
from app.schemas.financial import AccountCreate, Category, Name, PositiveAmount


class OnboardingAccount(AccountCreate):
    # Tarjeta de crédito: día del mes en que vence el pago (se convierte a días de gracia desde el corte)
    payment_day: Optional[int] = Field(None, ge=1, le=31)


class OnboardingFixedExpense(BaseModel):
    """Gasto fijo mensual (alquiler, internet...). Se guarda como gasto recurrente."""
    description: Name
    amount: PositiveAmount
    day: int = Field(..., ge=1, le=31)
    category: Category = "Otros Gastos"


class OnboardingDataInput(BaseModel):
    # 1. Personales
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    preferred_currency: str = Field(default="DOP", description="DOP, USD, EUR, etc.")

    # 2. Laborales
    employment_type: str = Field(..., description="employed, freelance, business_owner, student, other")
    industry_or_role: Optional[str] = None

    # 3. Financieros
    monthly_income_range: str = Field(..., description="Rango de ingresos")
    income_sources: List[str] = Field(default_factory=list, description="Lista de fuentes de ingreso")
    income_frequency: str = Field(..., description="monthly, biweekly, weekly, irregular")

    # 4. Situación y Metas
    financial_situation_status: str = Field(..., description="stressful, living_paycheck_to_paycheck, stable, wealth_building")
    primary_goals: List[str] = Field(default_factory=list, description="Lista de metas principales")

    # 5. Adquisición
    referral_source: str = Field(..., description="tiktok, instagram, youtube, friend, google, other")
    referral_detail: Optional[str] = None

    # 6. Arranque de la app (todo opcional): día de cobro, cuentas, gastos fijos y colchón de emergencia
    pay_day: Optional[int] = Field(None, ge=1, le=31)
    accounts: List[OnboardingAccount] = Field(default_factory=list, max_length=10)
    fixed_expenses: List[OnboardingFixedExpense] = Field(default_factory=list, max_length=15)
    emergency_months: Optional[int] = Field(None, ge=1, le=24)


class UserProfileOut(CoreSchema):
    id: str
    user_id: str
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    preferred_currency: str
    employment_type: Optional[str] = None
    industry_or_role: Optional[str] = None
    monthly_income_range: Optional[str] = None
    income_sources: Optional[List[str]] = None
    income_frequency: Optional[str] = None
    financial_situation_status: Optional[str] = None
    primary_goals: Optional[List[str]] = None
    referral_source: Optional[str] = None
    referral_detail: Optional[str] = None


class OnboardingStatusResponse(BaseModel):
    onboarding_completed: bool
    user_id: str
    email: str
    full_name: str
    profile: Optional[UserProfileOut] = None
