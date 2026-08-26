from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, onboarding

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Security"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["User Onboarding & Profile"])
