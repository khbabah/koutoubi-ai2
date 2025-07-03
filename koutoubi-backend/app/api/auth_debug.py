from fastapi import APIRouter, Depends, Request
from app.api.auth import get_current_user
from app.models.user import User
import os

router = APIRouter(prefix="/api/v1/auth-debug", tags=["auth-debug"])

@router.get("/verify")
async def verify_token(request: Request, current_user: User = Depends(get_current_user)):
    """Debug endpoint to verify authentication"""
    return {
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active
        },
        "headers": {
            "authorization": request.headers.get("authorization"),
            "origin": request.headers.get("origin")
        }
    }

@router.get("/config")
async def get_config():
    """Show current auth configuration"""
    return {
        "SECRET_KEY_SET": bool(os.getenv("SECRET_KEY")),
        "ACCESS_TOKEN_EXPIRE_MINUTES": os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"),
        "DEBUG": os.getenv("DEBUG", "true")
    }
