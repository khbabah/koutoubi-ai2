"""
Usage tracking model for monitoring feature usage and limits
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class UsageTracking(Base):
    __tablename__ = "usage_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=True)
    
    # Feature tracking
    feature_name = Column(String, nullable=False)  # ai_summary, ai_question, quiz_generation, etc.
    action = Column(String, nullable=False)  # generate, view, download, etc.
    
    # Détails
    resource_id = Column(String, nullable=True)  # ID du cours, chapitre, etc.
    resource_type = Column(String, nullable=True)  # course, chapter, page
    extra_data = Column(String, nullable=True)  # JSON pour infos supplémentaires
    
    # Coût en crédits (pour système de crédits futur)
    credits_used = Column(Float, default=1.0)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relations
    user = relationship("User")
    subscription = relationship("UserSubscription", back_populates="usage")
    
    # Index pour les requêtes fréquentes
    __table_args__ = (
        # Index composite pour les requêtes de comptage
        # Ex: compter les AI summaries d'un user ce mois-ci
        # Index('idx_user_feature_date', 'user_id', 'feature_name', 'created_at'),
    )