"""
Subscription schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PlanType(str, Enum):
    FREE = "free"
    PREMIUM_MONTHLY = "premium_monthly"
    PREMIUM_YEARLY = "premium_yearly"
    STUDENT_YEARLY = "student_yearly"


class SubscriptionPlanBase(BaseModel):
    name: str
    type: PlanType
    price: float
    duration_days: int
    
    # Limites
    ai_summaries_limit: Optional[int] = None
    ai_questions_daily_limit: Optional[int] = None
    quiz_generation_weekly_limit: Optional[int] = None
    mindmap_generation_monthly_limit: Optional[int] = None
    flashcards_limit: Optional[int] = None
    favorites_limit: Optional[int] = None
    pdf_download_enabled: bool = False
    offline_mode_enabled: bool = False
    
    features: Optional[str] = None


class SubscriptionPlan(SubscriptionPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserSubscriptionBase(BaseModel):
    plan_id: int
    status: str = "active"


class UserSubscriptionCreate(UserSubscriptionBase):
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    amount_paid: Optional[float] = None


class UserSubscription(UserSubscriptionBase):
    id: int
    user_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    plan: Optional[SubscriptionPlan] = None
    
    class Config:
        from_attributes = True


class UsageStats(BaseModel):
    feature: str
    used: int
    limit: Optional[int] = None
    remaining: Optional[int] = None
    period: str  # daily, weekly, monthly
    reset_date: Optional[datetime] = None


class SubscriptionStatus(BaseModel):
    has_subscription: bool
    plan_type: str
    plan_name: str
    is_active: bool
    end_date: Optional[datetime] = None
    usage_stats: Dict[str, UsageStats]
    can_upgrade: bool