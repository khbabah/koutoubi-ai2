"""
Initialize subscription plans in the database
"""
from app.core.database import SessionLocal, engine, Base
from app.models.subscription import SubscriptionPlan, PlanType
import json

# Create tables
Base.metadata.create_all(bind=engine)

def init_plans():
    db = SessionLocal()
    
    try:
        # Check if plans already exist
        existing_plans = db.query(SubscriptionPlan).count()
        if existing_plans > 0:
            print(f"Plans already exist ({existing_plans} plans found)")
            return
        
        # Define plans
        plans = [
            {
                "name": "Gratuit",
                "type": PlanType.FREE,
                "price": 0,
                "duration_days": 0,
                "ai_summaries_limit": 3,
                "ai_questions_daily_limit": 5,
                "quiz_generation_weekly_limit": 1,
                "mindmap_generation_monthly_limit": 2,
                "flashcards_limit": 20,
                "favorites_limit": 10,
                "pdf_download_enabled": False,
                "offline_mode_enabled": False,
                "features": json.dumps({
                    "pdf_reading": True,
                    "basic_search": True,
                    "limited_ai": True
                })
            },
            {
                "name": "Premium Mensuel",
                "type": PlanType.PREMIUM_MONTHLY,
                "price": 19.99,
                "duration_days": 30,
                "ai_summaries_limit": None,  # Unlimited
                "ai_questions_daily_limit": None,
                "quiz_generation_weekly_limit": None,
                "mindmap_generation_monthly_limit": None,
                "flashcards_limit": None,
                "favorites_limit": None,
                "pdf_download_enabled": True,
                "offline_mode_enabled": True,
                "features": json.dumps({
                    "pdf_reading": True,
                    "pdf_download": True,
                    "unlimited_ai": True,
                    "offline_mode": True,
                    "priority_support": True,
                    "advanced_analytics": True
                })
            },
            {
                "name": "Premium Annuel",
                "type": PlanType.PREMIUM_YEARLY,
                "price": 199,
                "duration_days": 365,
                "ai_summaries_limit": None,
                "ai_questions_daily_limit": None,
                "quiz_generation_weekly_limit": None,
                "mindmap_generation_monthly_limit": None,
                "flashcards_limit": None,
                "favorites_limit": None,
                "pdf_download_enabled": True,
                "offline_mode_enabled": True,
                "features": json.dumps({
                    "pdf_reading": True,
                    "pdf_download": True,
                    "unlimited_ai": True,
                    "offline_mode": True,
                    "priority_support": True,
                    "advanced_analytics": True,
                    "early_access": True
                })
            },
            {
                "name": "Étudiant Annuel",
                "type": PlanType.STUDENT_YEARLY,
                "price": 149,
                "duration_days": 365,
                "ai_summaries_limit": None,
                "ai_questions_daily_limit": None,
                "quiz_generation_weekly_limit": None,
                "mindmap_generation_monthly_limit": None,
                "flashcards_limit": None,
                "favorites_limit": None,
                "pdf_download_enabled": True,
                "offline_mode_enabled": True,
                "features": json.dumps({
                    "pdf_reading": True,
                    "pdf_download": True,
                    "unlimited_ai": True,
                    "offline_mode": True,
                    "student_verification_required": True
                })
            }
        ]
        
        # Create plans
        for plan_data in plans:
            plan = SubscriptionPlan(**plan_data)
            db.add(plan)
            print(f"Created plan: {plan.name} ({plan.type})")
        
        db.commit()
        print(f"\nSuccessfully created {len(plans)} subscription plans!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_plans()