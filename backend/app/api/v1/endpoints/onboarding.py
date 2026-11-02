import calendar
from datetime import date
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.financial import Account
from app.models.planning import RecurringTransaction, SavingsGoal
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.onboarding import (
    OnboardingDataInput,
    UserProfileOut,
    OnboardingStatusResponse,
)
from app.api.deps import get_current_user
from app.services.insights import add_months
from app.services.ledger import LIABILITY_TYPES, money

router = APIRouter()

EMERGENCY_GOAL = "emergency_fund"
MONEY_FIELDS = ("balance", "overdraft_limit", "credit_limit", "min_balance")


def _next_on_day(today: date, day: int) -> date:
    """Próxima fecha (después de hoy) con ese día del mes; si el mes es corto, su último día."""
    for d in (today.replace(day=1), add_months(today.replace(day=1), 1)):
        candidate = d.replace(day=min(day, calendar.monthrange(d.year, d.month)[1]))
        if candidate > today:
            return candidate
    return candidate


def _seed_finances(db: Session, user_id: str, profile: UserProfile, payload: OnboardingDataInput) -> None:
    """Deja la app configurada con lo que el usuario contó: periodo, cuentas, gastos fijos y meta de emergencia."""
    if payload.pay_day:
        profile.budget_reset_day = payload.pay_day

    accounts = []
    for acc_in in payload.accounts:
        data = acc_in.model_dump(exclude={"payment_day"})
        data.update({k: money(data[k]) for k in MONEY_FIELDS if data.get(k) is not None})
        if acc_in.cutoff_day and acc_in.payment_day:
            # ponytail: meses de 30 días; puede desfasar la alerta de pago 1 día en meses de 31.
            data["grace_days"] = (acc_in.payment_day - acc_in.cutoff_day) % 30 or 30
        account = Account(user_id=user_id, **data)
        db.add(account)
        accounts.append(account)
    db.flush()

    # Los gastos fijos se pagan desde la primera cuenta que no sea tarjeta de crédito
    payer = next((a for a in accounts if a.type not in LIABILITY_TYPES), None)
    today = date.today()
    for fixed in payload.fixed_expenses:
        db.add(RecurringTransaction(
            user_id=user_id, kind="expense", description=fixed.description, category=fixed.category,
            amount=money(fixed.amount), account_id=payer.id if payer else None,
            account_name=payer.name if payer else None, frequency="monthly",
            next_date=_next_on_day(today, fixed.day),
        ))

    monthly_fixed = sum((money(f.amount) for f in payload.fixed_expenses), money(0))
    if payload.emergency_months and monthly_fixed > 0 and EMERGENCY_GOAL in payload.primary_goals:
        db.add(SavingsGoal(user_id=user_id, name="Fondo de emergencia", target_amount=monthly_fixed * payload.emergency_months))


@router.get(
    "/status",
    response_model=OnboardingStatusResponse,
    summary="Obtener estado de onboarding del usuario",
)
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    return OnboardingStatusResponse(
        onboarding_completed=current_user.onboarding_completed,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        profile=UserProfileOut.model_validate(profile) if profile else None,
    )


@router.post(
    "/complete",
    response_model=OnboardingStatusResponse,
    summary="Guardar recopilación de datos y completar onboarding",
)
def complete_onboarding(
    payload: OnboardingDataInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    # Check if profile already exists
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        profile = UserProfile(
            user_id=current_user.id,
            phone=payload.phone,
            country=payload.country,
            city=payload.city,
            preferred_currency=payload.preferred_currency,
            employment_type=payload.employment_type,
            industry_or_role=payload.industry_or_role,
            monthly_income_range=payload.monthly_income_range,
            income_sources=payload.income_sources,
            income_frequency=payload.income_frequency,
            financial_situation_status=payload.financial_situation_status,
            primary_goals=payload.primary_goals,
            referral_source=payload.referral_source,
            referral_detail=payload.referral_detail,
        )
        db.add(profile)
    else:
        # Update existing profile
        profile.phone = payload.phone
        profile.country = payload.country
        profile.city = payload.city
        profile.preferred_currency = payload.preferred_currency
        profile.employment_type = payload.employment_type
        profile.industry_or_role = payload.industry_or_role
        profile.monthly_income_range = payload.monthly_income_range
        profile.income_sources = payload.income_sources
        profile.income_frequency = payload.income_frequency
        profile.financial_situation_status = payload.financial_situation_status
        profile.primary_goals = payload.primary_goals
        profile.referral_source = payload.referral_source
        profile.referral_detail = payload.referral_detail

    # Solo la primera vez: repetir el onboarding no duplica cuentas ni gastos fijos
    if not current_user.onboarding_completed:
        _seed_finances(db, current_user.id, profile, payload)

    # Mark user as onboarding completed
    current_user.onboarding_completed = True
    db.commit()
    db.refresh(current_user)
    db.refresh(profile)

    return OnboardingStatusResponse(
        onboarding_completed=True,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        profile=UserProfileOut.model_validate(profile),
    )
