"""
Main admin router that combines all admin endpoints
"""
from fastapi import APIRouter
from .admin import users, groups, content, reports

router = APIRouter()

# Include all admin sub-routers
router.include_router(users.router, tags=["admin-users"])
router.include_router(groups.router, tags=["admin-groups"])
router.include_router(content.router, tags=["admin-content"])
router.include_router(reports.router, tags=["admin-reports"])