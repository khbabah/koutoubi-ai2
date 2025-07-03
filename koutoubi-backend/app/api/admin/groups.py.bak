"""
Admin endpoints for group management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
import secrets
import string

from app.core.database import get_db
from app.core.permissions import ensure_admin_role
from app.models.group import Group as GroupModel
from app.models.user import User as UserModel
from app.schemas.group import Group, GroupCreate, GroupUpdate, GroupWithMembers
from app.api.auth import get_current_user

router = APIRouter()


def generate_group_code(length: int = 8) -> str:
    """Generate a unique group code"""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@router.get("/groups", response_model=List[Group])
def list_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    group_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    List all groups with pagination and filters
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    query = db.query(GroupModel)
    
    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                GroupModel.name.ilike(search_filter),
                GroupModel.description.ilike(search_filter),
                GroupModel.code.ilike(search_filter)
            )
        )
    
    if group_type:
        query = query.filter(GroupModel.group_type == group_type)
    
    if is_active is not None:
        query = query.filter(GroupModel.is_active == is_active)
    
    # Get groups with member count
    groups = query.offset(skip).limit(limit).all()
    
    # Add member count to each group
    result = []
    for group in groups:
        group_dict = group.__dict__.copy()
        group_dict['member_count'] = len(group.members)
        result.append(Group(**group_dict))
    
    return result


@router.get("/groups/stats")
def get_group_statistics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get group statistics
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    # Get group counts by type
    type_counts = db.query(
        GroupModel.group_type,
        func.count(GroupModel.id).label('count')
    ).group_by(GroupModel.group_type).all()
    
    # Get active/inactive counts
    active_count = db.query(GroupModel).filter(GroupModel.is_active == True).count()
    inactive_count = db.query(GroupModel).filter(GroupModel.is_active == False).count()
    
    # Get average members per group
    total_groups = db.query(GroupModel).count()
    
    return {
        "total_groups": total_groups,
        "type_distribution": {type_: count for type_, count in type_counts},
        "active_groups": active_count,
        "inactive_groups": inactive_count
    }


@router.get("/groups/{group_id}", response_model=GroupWithMembers)
def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get specific group details with members
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    group = db.query(GroupModel).options(
        joinedload(GroupModel.created_by),
        joinedload(GroupModel.members)
    ).filter(GroupModel.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    return group


@router.post("/groups", response_model=Group)
def create_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Create a new group
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    # Generate unique code
    while True:
        code = generate_group_code()
        existing = db.query(GroupModel).filter(GroupModel.code == code).first()
        if not existing:
            break
    
    group = GroupModel(
        **group_data.dict(),
        code=code,
        created_by_id=current_user.id
    )
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # Add member count
    group_dict = group.__dict__.copy()
    group_dict['member_count'] = 0
    
    return Group(**group_dict)


@router.put("/groups/{group_id}", response_model=Group)
def update_group(
    group_id: str,
    group_update: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Update group information
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    group = db.query(GroupModel).filter(GroupModel.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    update_data = group_update.dict(exclude_unset=True)
    
    # Update group fields
    for field, value in update_data.items():
        if hasattr(group, field):
            setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    
    # Add member count
    group_dict = group.__dict__.copy()
    group_dict['member_count'] = len(group.members)
    
    return Group(**group_dict)


@router.delete("/groups/{group_id}")
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Delete a group
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    group = db.query(GroupModel).filter(GroupModel.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    db.delete(group)
    db.commit()
    
    return {"message": "Group deleted successfully"}


@router.post("/groups/{group_id}/members/{user_id}")
def add_member_to_group(
    group_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Add a member to a group
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    group = db.query(GroupModel).filter(GroupModel.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already a member
    if user in group.members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this group"
        )
    
    # Check max members limit
    if group.max_members and len(group.members) >= int(group.max_members):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group has reached maximum member limit"
        )
    
    group.members.append(user)
    db.commit()
    
    return {"message": "Member added successfully"}


@router.delete("/groups/{group_id}/members/{user_id}")
def remove_member_from_group(
    group_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Remove a member from a group
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    group = db.query(GroupModel).filter(GroupModel.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is a member
    if user not in group.members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a member of this group"
        )
    
    group.members.remove(user)
    db.commit()
    
    return {"message": "Member removed successfully"}