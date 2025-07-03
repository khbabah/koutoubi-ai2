from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import base64
import io
from PIL import Image

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, verify_token
from app.core.config import settings
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, Token, UserUpdate
from app.core.constants import UserRole

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_user_by_email(db: Session, email: str):
    return db.query(UserModel).filter(UserModel.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(UserModel).filter(UserModel.username == username).first()


def authenticate_user(db: Session, username: str, password: str):
    # Try both email and username
    user = get_user_by_email(db, username) or get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    username = verify_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_email(db, username) or get_user_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    if user.username:
        db_user = get_user_by_username(db, user.username)
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = UserModel(
        email=user.email,
        username=user.username or user.email.split('@')[0],
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_active=user.is_active,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Login attempt for username: {form_data.username}")
    
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Failed login attempt for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.info(f"Successful login for user: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=User)
def update_user_profile(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    update_data = user_update.dict(exclude_unset=True)
    
    # If updating password, verify current password first
    if "new_password" in update_data and update_data["new_password"] is not None:
        if "current_password" not in update_data or not update_data["current_password"]:
            raise HTTPException(
                status_code=400,
                detail="Le mot de passe actuel est requis pour changer le mot de passe"
            )
        
        # Verify current password
        if not verify_password(update_data["current_password"], current_user.hashed_password):
            raise HTTPException(
                status_code=400,
                detail="Mot de passe actuel incorrect"
            )
        
        # Update password hash
        update_data["hashed_password"] = get_password_hash(update_data["new_password"])
        # Remove password fields from update_data
        update_data.pop("current_password", None)
        update_data.pop("new_password", None)
    
    # If updating email, check if it's already taken
    if "email" in update_data and update_data["email"] != current_user.email:
        existing_user = get_user_by_email(db, update_data["email"])
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    # If updating username, check if it's already taken
    if "username" in update_data and update_data["username"] != current_user.username:
        existing_user = get_user_by_username(db, update_data["username"])
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
    
    # Update user fields
    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload user avatar"""
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image"
        )
    
    # Read and resize image
    try:
        contents = file.file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to max 200x200 while maintaining aspect ratio
        image.thumbnail((200, 200))
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Save as data URL
        current_user.avatar_url = f"data:image/jpeg;base64,{img_base64}"
        db.commit()
        
        return {"message": "Avatar uploaded successfully", "avatar_url": current_user.avatar_url}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing image: {str(e)}"
        )


@router.delete("/me/avatar")
def delete_avatar(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user avatar"""
    current_user.avatar_url = None
    db.commit()
    return {"message": "Avatar deleted successfully"}