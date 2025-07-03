"""
Group schemas for request/response models
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from app.schemas.user import User


class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    group_type: str = "custom"
    allow_member_invites: bool = False
    require_approval: bool = False
    max_members: Optional[int] = None
    
    @field_validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Group name must be at least 3 characters long')
        return v.strip()
    
    @field_validator('group_type')
    def validate_type(cls, v):
        allowed_types = ["class", "school", "custom", "study_group"]
        if v not in allowed_types:
            raise ValueError(f'Group type must be one of: {", ".join(allowed_types)}')
        return v


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    allow_member_invites: Optional[bool] = None
    require_approval: Optional[bool] = None
    max_members: Optional[int] = None
    is_active: Optional[bool] = None
    
    @field_validator('name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) < 3:
            raise ValueError('Group name must be at least 3 characters long')
        return v.strip() if v else v


class Group(GroupBase):
    id: str
    code: str
    is_active: bool
    created_by_id: str
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class GroupWithMembers(Group):
    created_by: User
    members: List[User] = []


class GroupMemberAdd(BaseModel):
    user_ids: List[str]


class GroupJoin(BaseModel):
    code: str