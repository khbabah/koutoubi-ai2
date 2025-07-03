"""
Favorites API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.favorite import Favorite

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_user_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all favorites for the current user"""
    try:
        favorites = db.query(Favorite).filter(
            Favorite.user_id == current_user.id
        ).order_by(Favorite.created_at.desc()).all()
        
        return [fav.to_dict() for fav in favorites]
    except Exception as e:
        logger.error(f"Error getting favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving favorites")


@router.post("/add")
async def add_favorite(
    course_id: str = Body(..., embed=True),
    niveau: str = Body(..., embed=True),
    annee: str = Body(..., embed=True),
    matiere: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a course to favorites"""
    try:
        # Check if already favorited
        existing = db.query(Favorite).filter(
            Favorite.user_id == current_user.id,
            Favorite.course_id == course_id
        ).first()
        
        if existing:
            return {"message": "Course already in favorites", "favorite": existing.to_dict()}
        
        # Create new favorite
        favorite = Favorite(
            user_id=current_user.id,
            course_id=course_id,
            niveau=niveau,
            annee=annee,
            matiere=matiere
        )
        
        db.add(favorite)
        db.commit()
        db.refresh(favorite)
        
        return {
            "message": "Course added to favorites",
            "favorite": favorite.to_dict()
        }
    except Exception as e:
        logger.error(f"Error adding favorite: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error adding to favorites")


@router.delete("/remove/{course_id}")
async def remove_favorite(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a course from favorites"""
    try:
        favorite = db.query(Favorite).filter(
            Favorite.user_id == current_user.id,
            Favorite.course_id == course_id
        ).first()
        
        if not favorite:
            raise HTTPException(status_code=404, detail="Favorite not found")
        
        db.delete(favorite)
        db.commit()
        
        return {"message": "Course removed from favorites"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing favorite: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error removing from favorites")


@router.get("/check/{course_id}")
async def check_favorite(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if a course is in favorites"""
    try:
        favorite = db.query(Favorite).filter(
            Favorite.user_id == current_user.id,
            Favorite.course_id == course_id
        ).first()
        
        return {
            "is_favorite": favorite is not None,
            "favorite": favorite.to_dict() if favorite else None
        }
    except Exception as e:
        logger.error(f"Error checking favorite: {str(e)}")
        raise HTTPException(status_code=500, detail="Error checking favorite status")