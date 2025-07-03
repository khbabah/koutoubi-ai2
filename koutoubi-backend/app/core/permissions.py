from typing import List, Optional
from fastapi import HTTPException, status, Depends
from app.models.user import User as UserModel
from app.core.constants import UserRole


def require_role(allowed_roles: List[str]):
    """
    Decorator to require specific roles for accessing an endpoint
    
    Usage:
        @require_role(["teacher", "admin"])
        def my_endpoint():
            ...
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Get current_user from kwargs
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{current_user.role}' not allowed. Required roles: {allowed_roles}"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def is_teacher_or_parent(user: UserModel) -> bool:
    """Check if user is a teacher, parent, or admin"""
    return user.role in UserRole.get_educator_roles()


def is_admin(user: UserModel) -> bool:
    """Check if user is an admin or super admin"""
    return user.role in UserRole.get_admin_roles()


def is_super_admin(user: UserModel) -> bool:
    """Check if user is a super admin"""
    return user.role == UserRole.SUPER_ADMIN.value


def is_student(user: UserModel) -> bool:
    """Check if user is a student"""
    return user.role == UserRole.STUDENT.value


def check_permission(user: UserModel, resource_owner_id: str, allow_public: bool = False) -> bool:
    """
    Check if user has permission to access a resource
    
    Args:
        user: Current user
        resource_owner_id: ID of the resource owner
        allow_public: Whether public access is allowed
        
    Returns:
        True if user has permission, False otherwise
    """
    # Owner always has access
    if str(user.id) == str(resource_owner_id):
        return True
    
    # Admin or super admin has access to everything
    if user.role in UserRole.get_admin_roles():
        return True
    
    # Public resources can be accessed by anyone
    if allow_public:
        return True
    
    return False


def ensure_can_edit(user: UserModel, resource_owner_id: str):
    """
    Ensure user can edit a resource, raise exception if not
    
    Args:
        user: Current user
        resource_owner_id: ID of the resource owner
    """
    if str(user.id) != str(resource_owner_id) and user.role not in UserRole.get_admin_roles():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this resource"
        )


def ensure_educator_role(user: UserModel):
    """
    Ensure user has educator privileges (teacher, parent, or admin)
    
    Args:
        user: Current user
    """
    if not is_teacher_or_parent(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for teachers and parents"
        )


def ensure_super_admin(user: UserModel):
    """
    Ensure user is a super admin, raise exception if not
    
    Args:
        user: Current user
    """
    if not is_super_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for super administrators"
        )


def ensure_admin_role(user: UserModel):
    """
    Ensure user has admin privileges (admin or super admin)
    
    Args:
        user: Current user
    """
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for administrators"
        )