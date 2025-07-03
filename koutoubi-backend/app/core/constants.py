"""
Application constants and enums
"""
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    TEACHER = "teacher"
    PARENT = "parent"
    STUDENT = "student"
    
    @classmethod
    def get_all_roles(cls):
        """Get all available roles"""
        return [role.value for role in cls]
    
    @classmethod
    def get_admin_roles(cls):
        """Get admin-level roles"""
        return [cls.SUPER_ADMIN.value, cls.ADMIN.value]
    
    @classmethod
    def get_educator_roles(cls):
        """Get educator roles (teacher, parent, and admin roles)"""
        return [cls.SUPER_ADMIN.value, cls.ADMIN.value, cls.TEACHER.value, cls.PARENT.value]


# Default values
DEFAULT_USER_ROLE = UserRole.STUDENT.value