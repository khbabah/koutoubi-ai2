"""
Subscription service for managing user subscriptions and usage limits
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import json
import logging

from app.models.subscription import UserSubscription, SubscriptionPlan, PlanType
from app.models.usage_tracking import UsageTracking
from app.models.user import User
from app.schemas.subscription import UsageStats, SubscriptionStatus

logger = logging.getLogger(__name__)


class SubscriptionService:
    
    @staticmethod
    def get_user_subscription(db: Session, user_id: str) -> Optional[UserSubscription]:
        """Get active subscription for user"""
        return db.query(UserSubscription).filter(
            and_(
                UserSubscription.user_id == user_id,
                UserSubscription.status == "active"
            )
        ).first()
    
    @staticmethod
    def get_user_plan(db: Session, user_id: str) -> SubscriptionPlan:
        """Get user's current plan (free if no subscription)"""
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        
        if subscription and subscription.plan:
            return subscription.plan
        
        # Return free plan
        free_plan = db.query(SubscriptionPlan).filter(
            SubscriptionPlan.type == PlanType.FREE
        ).first()
        
        if not free_plan:
            # Create default free plan if not exists
            free_plan = SubscriptionPlan(
                name="Gratuit",
                type=PlanType.FREE,
                price=0,
                duration_days=0,
                ai_summaries_limit=3,
                ai_questions_daily_limit=5,
                quiz_generation_weekly_limit=1,
                mindmap_generation_monthly_limit=2,
                flashcards_limit=20,
                favorites_limit=10,
                pdf_download_enabled=False,
                offline_mode_enabled=False
            )
            db.add(free_plan)
            db.commit()
        
        return free_plan
    
    @staticmethod
    def check_feature_limit(
        db: Session, 
        user_id: str, 
        feature_name: str, 
        period: str = "monthly"
    ) -> tuple[bool, int, Optional[int]]:
        """
        Check if user can use a feature based on their plan limits
        Returns: (can_use, used_count, limit)
        """
        plan = SubscriptionService.get_user_plan(db, user_id)
        
        # Get limit for feature
        limit_map = {
            "ai_summary": plan.ai_summaries_limit,
            "ai_question": plan.ai_questions_daily_limit,
            "quiz_generation": plan.quiz_generation_weekly_limit,
            "mindmap_generation": plan.mindmap_generation_monthly_limit,
            "flashcards": plan.flashcards_limit,
            "favorites": plan.favorites_limit,
        }
        
        limit = limit_map.get(feature_name)
        
        # If no limit (None), feature is unlimited
        if limit is None:
            return True, 0, None
        
        # Calculate period start date
        now = datetime.utcnow()
        if period == "daily":
            period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "weekly":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "monthly":
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            period_start = now - timedelta(days=30)
        
        # Count usage in period
        used_count = db.query(UsageTracking).filter(
            and_(
                UsageTracking.user_id == user_id,
                UsageTracking.feature_name == feature_name,
                UsageTracking.created_at >= period_start
            )
        ).count()
        
        can_use = used_count < limit
        return can_use, used_count, limit
    
    @staticmethod
    def track_usage(
        db: Session,
        user_id: str,
        feature_name: str,
        action: str = "use",
        resource_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> UsageTracking:
        """Track feature usage"""
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        
        usage = UsageTracking(
            user_id=user_id,
            subscription_id=subscription.id if subscription else None,
            feature_name=feature_name,
            action=action,
            resource_id=resource_id,
            resource_type=resource_type,
            extra_data=json.dumps(metadata) if metadata else None
        )
        
        db.add(usage)
        db.commit()
        db.refresh(usage)
        
        return usage
    
    @staticmethod
    def get_usage_stats(db: Session, user_id: str) -> Dict[str, UsageStats]:
        """Get usage statistics for all features"""
        plan = SubscriptionService.get_user_plan(db, user_id)
        now = datetime.utcnow()
        
        stats = {}
        
        # AI Summaries (monthly)
        can_use, used, limit = SubscriptionService.check_feature_limit(
            db, user_id, "ai_summary", "monthly"
        )
        stats["ai_summary"] = UsageStats(
            feature="ai_summary",
            used=used,
            limit=limit,
            remaining=limit - used if limit else None,
            period="monthly",
            reset_date=now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) + timedelta(days=32)
        )
        
        # AI Questions (daily)
        can_use, used, limit = SubscriptionService.check_feature_limit(
            db, user_id, "ai_question", "daily"
        )
        stats["ai_question"] = UsageStats(
            feature="ai_question",
            used=used,
            limit=limit,
            remaining=limit - used if limit else None,
            period="daily",
            reset_date=now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        )
        
        # Quiz Generation (weekly)
        can_use, used, limit = SubscriptionService.check_feature_limit(
            db, user_id, "quiz_generation", "weekly"
        )
        stats["quiz_generation"] = UsageStats(
            feature="quiz_generation",
            used=used,
            limit=limit,
            remaining=limit - used if limit else None,
            period="weekly",
            reset_date=now + timedelta(days=(7 - now.weekday()))
        )
        
        # Mindmap Generation (monthly)
        can_use, used, limit = SubscriptionService.check_feature_limit(
            db, user_id, "mindmap_generation", "monthly"
        )
        stats["mindmap_generation"] = UsageStats(
            feature="mindmap_generation",
            used=used,
            limit=limit,
            remaining=limit - used if limit else None,
            period="monthly",
            reset_date=now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) + timedelta(days=32)
        )
        
        # Favorites (total, not period-based)
        from app.models.favorite import Favorite
        favorites_count = db.query(Favorite).filter(
            Favorite.user_id == user_id
        ).count()
        
        stats["favorites"] = UsageStats(
            feature="favorites",
            used=favorites_count,
            limit=plan.favorites_limit,
            remaining=plan.favorites_limit - favorites_count if plan.favorites_limit else None,
            period="total",
            reset_date=None
        )
        
        return stats
    
    @staticmethod
    def get_subscription_status(db: Session, user_id: str) -> SubscriptionStatus:
        """Get complete subscription status for user"""
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        plan = SubscriptionService.get_user_plan(db, user_id)
        usage_stats = SubscriptionService.get_usage_stats(db, user_id)
        
        return SubscriptionStatus(
            has_subscription=subscription is not None,
            plan_type=plan.type,
            plan_name=plan.name,
            is_active=subscription.status == "active" if subscription else False,
            end_date=subscription.end_date if subscription else None,
            usage_stats=usage_stats,
            can_upgrade=plan.type == PlanType.FREE
        )
    
    @staticmethod
    def create_subscription(
        db: Session,
        user_id: str,
        plan_id: int,
        payment_method: Optional[str] = None,
        payment_reference: Optional[str] = None,
        amount_paid: Optional[float] = None
    ) -> UserSubscription:
        """Create a new subscription for user"""
        # Cancel existing subscription
        existing = SubscriptionService.get_user_subscription(db, user_id)
        if existing:
            existing.status = "cancelled"
            existing.cancelled_at = datetime.utcnow()
        
        # Get plan
        plan = db.query(SubscriptionPlan).filter(
            SubscriptionPlan.id == plan_id
        ).first()
        
        if not plan:
            raise ValueError("Plan not found")
        
        # Calculate end date
        end_date = None
        if plan.duration_days > 0:
            end_date = datetime.utcnow() + timedelta(days=plan.duration_days)
        
        # Create subscription
        subscription = UserSubscription(
            user_id=user_id,
            plan_id=plan_id,
            status="active",
            start_date=datetime.utcnow(),
            end_date=end_date,
            payment_method=payment_method,
            payment_reference=payment_reference,
            amount_paid=amount_paid or plan.price
        )
        
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        
        return subscription