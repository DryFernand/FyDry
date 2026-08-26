from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.onboarding import (
    OnboardingDataInput,
    UserProfileOut,
    OnboardingStatusResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


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
