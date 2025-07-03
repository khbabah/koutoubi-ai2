"""
Group model for organizing users
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid


def generate_uuid():
    return str(uuid.uuid4())


# Association table for many-to-many relationship between groups and users
group_members_association = Table(
    'group_members_association',
    Base.metadata,
    Column('group_id', String, ForeignKey('groups.id'), primary_key=True),
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('joined_at', DateTime, default=datetime.utcnow)
)


class Group(Base):
    __tablename__ = "groups"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    code = Column(String, unique=True, index=True)  # Unique code for joining
    is_active = Column(Boolean, default=True)
    created_by_id = Column(String, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Group type (e.g., class, school, custom)
    group_type = Column(String, default="custom")
    
    # Settings
    allow_member_invites = Column(Boolean, default=False)
    require_approval = Column(Boolean, default=False)
    max_members = Column(String)  # Can be null for unlimited
    
    # Relations
    created_by = relationship("User", foreign_keys=[created_by_id])
    members = relationship("User", secondary=group_members_association, backref="groups")