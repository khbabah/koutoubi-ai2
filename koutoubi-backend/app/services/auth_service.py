"""
Authentication service for user management.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for handling authentication operations."""
    
    @staticmethod
    def authenticate_user(
        db: Session, 
        username: str, 
        password: str
    ) -> Optional[User]:
        """Authenticate user with username and password."""
        # Try to find user by username or email
        user = db.query(User).filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            return None
            
        if not verify_password(password, user.hashed_password):
            return None
            
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        return user
    
    @staticmethod
    def create_user(
        db: Session, 
        user_create: UserCreate
    ) -> User:
        """Create a new user."""
        # Check if username already exists
        if db.query(User).filter(User.username == user_create.username).first():
            raise ValueError("Username already exists")
            
        # Check if email already exists
        if user_create.email and db.query(User).filter(User.email == user_create.email).first():
            raise ValueError("Email already exists")
        
        # Create user
        db_user = User(
            username=user_create.username,
            email=user_create.email,
            full_name=user_create.full_name,
            hashed_password=get_password_hash(user_create.password),
            is_active=True
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"Created new user: {db_user.username}")
        return db_user
    
    @staticmethod
    def update_user(
        db: Session,
        user: User,
        user_update: UserUpdate
    ) -> User:
        """Update user information."""
        update_data = user_update.dict(exclude_unset=True)
        
        # Handle password update
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        # Check if email is being updated and is unique
        if "email" in update_data and update_data["email"] != user.email:
            existing = db.query(User).filter(
                User.email == update_data["email"],
                User.id != user.id
            ).first()
            if existing:
                raise ValueError("Email already exists")
        
        # Update user
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload."""
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def create_tokens(user: User) -> Dict[str, str]:
        """Create access and refresh tokens for user."""
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=access_token_expires
        )
        
        # Create refresh token (longer expiry)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_access_token(
            data={"sub": user.username, "type": "refresh"},
            expires_delta=refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    def refresh_access_token(
        db: Session, 
        refresh_token: str
    ) -> Optional[Dict[str, str]]:
        """Refresh access token using refresh token."""
        payload = AuthService.verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        
        username = payload.get("sub")
        user = AuthService.get_user_by_username(db, username)
        if not user or not user.is_active:
            return None
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    def delete_user(db: Session, user: User) -> bool:
        """Delete user account."""
        try:
            # Soft delete - just deactivate
            user.is_active = False
            db.commit()
            
            logger.info(f"Deleted user: {user.username}")
            return True
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def get_user_stats(db: Session, user: User) -> Dict[str, Any]:
        """Get user statistics."""
        from app.models.progress import UserProgress
        
        # Get progress stats
        progress_count = db.query(UserProgress).filter(
            UserProgress.user_id == user.id
        ).count()
        
        # TODO: UserProgress model doesn't have total_time_spent field
        # This needs to be updated when a proper CourseProgress model is created
        total_time = 0  # Placeholder until proper progress tracking is implemented
        
        # TODO: Quiz statistics need to be implemented when QuizAttempt model is added
        quiz_attempts = 0
        avg_score = 0
        
        return {
            "courses_accessed": progress_count,
            "total_study_time": total_time,
            "quiz_attempts": quiz_attempts,
            "average_quiz_score": round(avg_score, 2),
            "member_since": user.created_at.isoformat(),
            "last_active": user.last_login.isoformat() if user.last_login else None
        }


# Singleton instance
auth_service = AuthService()