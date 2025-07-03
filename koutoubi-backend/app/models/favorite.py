"""
Favorite model for course bookmarks
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String, nullable=False)  # ID du cours depuis get_available_courses()
    niveau = Column(String, nullable=False)
    annee = Column(String, nullable=False)
    matiere = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relations
    user = relationship("User", back_populates="favorites")
    
    # Contrainte unique pour éviter les doublons
    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', name='_user_course_uc'),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "niveau": self.niveau,
            "annee": self.annee,
            "matiere": self.matiere,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }