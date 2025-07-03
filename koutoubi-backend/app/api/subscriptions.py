"""
Subscription API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.subscription import SubscriptionPlan
from app.services.subscription_service import SubscriptionService
from app.schemas.subscription import (
    SubscriptionPlan as SubscriptionPlanSchema,
    SubscriptionStatus,
    UserSubscriptionCreate,
    UserSubscription as UserSubscriptionSchema
)
from datetime import datetime

router = APIRouter()


@router.get("/plans", response_model=List[SubscriptionPlanSchema])
def get_all_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans"""
    plans = db.query(SubscriptionPlan).all()
    return plans


@router.get("/status", response_model=SubscriptionStatus)
def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription status and usage"""
    return SubscriptionService.get_subscription_status(db, current_user.id)


@router.post("/subscribe", response_model=UserSubscriptionSchema)
def create_subscription(
    plan_id: int = Body(..., embed=True),
    payment_method: str = Body(None, embed=True),
    payment_reference: str = Body(None, embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new subscription for the current user"""
    try:
        subscription = SubscriptionService.create_subscription(
            db,
            user_id=current_user.id,
            plan_id=plan_id,
            payment_method=payment_method,
            payment_reference=payment_reference
        )
        
        # Load plan relationship
        subscription.plan = db.query(SubscriptionPlan).filter(
            SubscriptionPlan.id == plan_id
        ).first()
        
        return subscription
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error creating subscription")


@router.post("/check-limit/{feature}")
def check_feature_limit(
    feature: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user can use a feature based on their limits"""
    # Map feature names to periods
    period_map = {
        "ai_summary": "monthly",
        "ai_question": "daily",
        "quiz_generation": "weekly",
        "mindmap_generation": "monthly",
        "flashcards": "total",
        "favorites": "total"
    }
    
    period = period_map.get(feature, "monthly")
    can_use, used, limit = SubscriptionService.check_feature_limit(
        db, current_user.id, feature, period
    )
    
    return {
        "can_use": can_use,
        "used": used,
        "limit": limit,
        "remaining": limit - used if limit else None,
        "feature": feature,
        "period": period
    }


@router.post("/track-usage")
def track_feature_usage(
    feature_name: str = Body(..., embed=True),
    action: str = Body("use", embed=True),
    resource_id: str = Body(None, embed=True),
    resource_type: str = Body(None, embed=True),
    metadata: dict = Body(None, embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track usage of a feature"""
    try:
        # First check if user can use the feature
        period_map = {
            "ai_summary": "monthly",
            "ai_question": "daily",
            "quiz_generation": "weekly",
            "mindmap_generation": "monthly"
        }
        
        if feature_name in period_map:
            can_use, used, limit = SubscriptionService.check_feature_limit(
                db, current_user.id, feature_name, period_map[feature_name]
            )
            
            if not can_use:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "message": f"Limite atteinte pour {feature_name}",
                        "used": used,
                        "limit": limit,
                        "upgrade_required": True
                    }
                )
        
        # Track usage
        usage = SubscriptionService.track_usage(
            db,
            user_id=current_user.id,
            feature_name=feature_name,
            action=action,
            resource_id=resource_id,
            resource_type=resource_type,
            metadata=metadata
        )
        
        return {"success": True, "usage_id": usage.id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error tracking usage")


@router.post("/cancel")
def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    subscription = SubscriptionService.get_user_subscription(db, current_user.id)
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    subscription.status = "cancelled"
    subscription.cancelled_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Subscription cancelled successfully"}