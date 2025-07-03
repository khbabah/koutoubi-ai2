"""
Subscription models for premium features
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class PlanType(str, enum.Enum):
    FREE = "free"
    PREMIUM_MONTHLY = "premium_monthly"
    PREMIUM_YEARLY = "premium_yearly"
    STUDENT_YEARLY = "student_yearly"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(PlanType), unique=True, nullable=False)
    price = Column(Float, nullable=False)  # En MAD
    duration_days = Column(Integer, nullable=False)  # 0 pour gratuit, 30 pour mensuel, 365 pour annuel
    
    # Limites
    ai_summaries_limit = Column(Integer, nullable=True)  # NULL = illimité
    ai_questions_daily_limit = Column(Integer, nullable=True)
    quiz_generation_weekly_limit = Column(Integer, nullable=True)
    mindmap_generation_monthly_limit = Column(Integer, nullable=True)
    flashcards_limit = Column(Integer, nullable=True)
    favorites_limit = Column(Integer, nullable=True)
    pdf_download_enabled = Column(Boolean, default=False)
    offline_mode_enabled = Column(Boolean, default=False)
    
    # Features
    features = Column(String, nullable=True)  # JSON string des features
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    subscriptions = relationship("UserSubscription", back_populates="plan")


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    
    status = Column(String, default="active")  # active, expired, cancelled
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_date = Column(DateTime, nullable=True)  # NULL pour gratuit
    
    # Paiement
    payment_method = Column(String, nullable=True)
    payment_reference = Column(String, nullable=True)
    amount_paid = Column(Float, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Relations
    user = relationship("User", back_populates="subscription")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    usage = relationship("UsageTracking", back_populates="subscription", cascade="all, delete-orphan")