import uuid
from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # 1. Datos Personales
    phone = Column(String(50), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    preferred_currency = Column(String(10), default="USD", nullable=False)

    # 2. Datos Laborales
    employment_type = Column(String(100), nullable=True)  # "employed", "freelance", "business_owner", "student", etc.
    industry_or_role = Column(String(150), nullable=True)

    # 3. Datos Financieros
    monthly_income_range = Column(String(100), nullable=True)  # "< 500", "500 - 1500", "1500 - 3000", "> 3000"
    income_sources = Column(JSON, nullable=True)  # ["salary", "freelance", "investments", "other"]
    income_frequency = Column(String(50), nullable=True)  # "monthly", "biweekly", "weekly", "irregular"

    # 4. Situación Económica y Metas
    financial_situation_status = Column(String(100), nullable=True)  # "stressful", "living_paycheck_to_paycheck", "stable", "wealth_building"
    primary_goals = Column(JSON, nullable=True)  # ["emergency_fund", "debt_payoff", "save_for_goal", "stop_living_paycheck", "expense_tracking"]

    # 5. Canal de Adquisición
    referral_source = Column(String(100), nullable=True)  # "tiktok", "instagram", "youtube", "friend_referral", "google_search", "other"
    referral_detail = Column(String(255), nullable=True)

    # Relación con User
    user = relationship("User", back_populates="profile")
