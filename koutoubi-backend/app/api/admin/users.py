"""
Admin endpoints for user management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.permissions import ensure_admin_role, ensure_super_admin
from app.core.security import get_password_hash
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, UserUpdate
from app.api.auth import get_current_user
from app.core.constants import UserRole

router = APIRouter()


@router.get("/users", response_model=List[User])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    List all users with pagination and filters
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    query = db.query(UserModel)
    
    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                UserModel.email.ilike(search_filter),
                UserModel.username.ilike(search_filter),
                UserModel.full_name.ilike(search_filter)
            )
        )
    
    if role:
        query = query.filter(UserModel.role == role)
    
    if is_active is not None:
        query = query.filter(UserModel.is_active == is_active)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    users = query.offset(skip).limit(limit).all()
    
    return users


@router.get("/users/stats")
def get_user_statistics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get user statistics
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    # Get user counts by role
    role_counts = db.query(
        UserModel.role,
        func.count(UserModel.id).label('count')
    ).group_by(UserModel.role).all()
    
    # Get active/inactive counts
    active_count = db.query(UserModel).filter(UserModel.is_active == True).count()
    inactive_count = db.query(UserModel).filter(UserModel.is_active == False).count()
    
    # Get recent registrations (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_registrations = db.query(UserModel).filter(
        UserModel.created_at >= thirty_days_ago
    ).count()
    
    return {
        "total_users": db.query(UserModel).count(),
        "role_distribution": {role: count for role, count in role_counts},
        "active_users": active_count,
        "inactive_users": inactive_count,
        "recent_registrations": recent_registrations
    }


@router.get("/users/{user_id}", response_model=User)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get specific user details
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/users/{user_id}", response_model=User)
def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Update user information
    Requires: Admin or Super Admin role
    Note: Only Super Admin can update other admin's information
    """
    ensure_admin_role(current_user)
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if trying to update another admin (only super admin can do this)
    if user.role in UserRole.get_admin_roles() and current_user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can modify other administrators"
        )
    
    # Check if trying to change role to admin (only super admin can do this)
    if user_update.role and user_update.role in UserRole.get_admin_roles():
        if current_user.role != UserRole.SUPER_ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super administrators can assign admin roles"
            )
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Handle password update
    if "new_password" in update_data and update_data["new_password"]:
        update_data["hashed_password"] = get_password_hash(update_data["new_password"])
        update_data.pop("new_password", None)
        update_data.pop("current_password", None)
    
    # Update user fields
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Delete a user
    Requires: Super Admin role
    """
    ensure_super_admin(current_user)
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Prevent deleting other super admins
    if user.role == UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete other super administrators"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Toggle user active status
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if trying to toggle another admin (only super admin can do this)
    if user.role in UserRole.get_admin_roles() and current_user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can modify other administrators"
        )
    
    # Prevent disabling yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disable your own account"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "is_active": user.is_active
    }