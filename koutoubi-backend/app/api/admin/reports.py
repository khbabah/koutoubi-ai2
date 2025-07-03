"""
Admin endpoints for reports and analytics
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import csv
import io
import json

from app.core.database import get_db
from app.core.permissions import ensure_admin_role
from app.models.user import User as UserModel
from app.models.quiz import QuizQuestion as QuizQuestionModel
from app.models.flashcard import Flashcard as FlashcardModel
from app.models.summary import ChapterSummary as SummaryModel
from app.models.progress import UserProgress as ProgressModel
from app.models.usage_tracking import UsageTracking as UsageModel
from app.api.auth import get_current_user

router = APIRouter()


@router.get("/reports/dashboard")
def get_dashboard_data(
    period: str = Query("30d", regex="^(7d|30d|90d|1y|all)$"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get comprehensive dashboard data for admin
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    # Calculate date range based on period
    end_date = datetime.utcnow()
    if period == "7d":
        start_date = end_date - timedelta(days=7)
    elif period == "30d":
        start_date = end_date - timedelta(days=30)
    elif period == "90d":
        start_date = end_date - timedelta(days=90)
    elif period == "1y":
        start_date = end_date - timedelta(days=365)
    else:  # all
        start_date = None
    
    # User metrics
    total_users = db.query(UserModel).count()
    active_users = db.query(UserModel).filter(UserModel.is_active == True).count()
    
    new_users = db.query(UserModel)
    if start_date:
        new_users = new_users.filter(UserModel.created_at >= start_date)
    new_users_count = new_users.count()
    
    # Content metrics
    total_quizzes = db.query(QuizQuestionModel).count()
    total_flashcards = db.query(FlashcardModel).count()
    total_summaries = db.query(SummaryModel).count()
    
    # Activity metrics
    if start_date:
        active_users_period = db.query(func.count(func.distinct(UserModel.id))).join(
            ProgressModel
        ).filter(
            ProgressModel.created_at >= start_date
        ).scalar() or 0
    else:
        active_users_period = active_users
    
    # User growth over time
    user_growth = []
    if period in ["7d", "30d"]:
        # Daily growth
        for i in range(int(period[:-1])):
            day = end_date - timedelta(days=i)
            count = db.query(UserModel).filter(
                func.date(UserModel.created_at) == day.date()
            ).count()
            user_growth.append({
                "date": day.strftime("%Y-%m-%d"),
                "count": count
            })
    
    user_growth.reverse()
    
    # Top performing content
    top_quizzes = db.query(
        QuizQuestionModel.id,
        QuizQuestionModel.question,
        func.count(ProgressModel.id).label('attempts')
    ).join(
        ProgressModel,
        ProgressModel.quiz_question_id == QuizQuestionModel.id
    ).group_by(
        QuizQuestionModel.id,
        QuizQuestionModel.question
    ).order_by(
        desc('attempts')
    ).limit(5).all()
    
    return {
        "period": period,
        "user_metrics": {
            "total": total_users,
            "active": active_users,
            "new": new_users_count,
            "active_in_period": active_users_period
        },
        "content_metrics": {
            "quizzes": total_quizzes,
            "flashcards": total_flashcards,
            "summaries": total_summaries
        },
        "user_growth": user_growth,
        "top_content": [
            {
                "id": quiz.id,
                "title": quiz.question[:100] + "..." if len(quiz.question) > 100 else quiz.question,
                "attempts": quiz.attempts
            }
            for quiz in top_quizzes
        ]
    }


@router.get("/reports/user-activity")
def get_user_activity_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get detailed user activity report
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    query = db.query(
        UserModel.id,
        UserModel.email,
        UserModel.username,
        UserModel.role,
        UserModel.created_at,
        UserModel.last_login,
        func.count(ProgressModel.id).label('total_activities'),
        func.max(ProgressModel.last_accessed).label('last_activity')
    ).outerjoin(
        ProgressModel
    ).group_by(
        UserModel.id
    )
    
    if start_date:
        query = query.filter(UserModel.created_at >= start_date)
    if end_date:
        query = query.filter(UserModel.created_at <= end_date)
    
    users = query.all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "created_at": user.created_at,
            "last_login": user.last_login,
            "total_activities": user.total_activities,
            "last_activity": user.last_activity
        }
        for user in users
    ]


@router.get("/reports/content-performance")
def get_content_performance_report(
    content_type: Optional[str] = Query(None, regex="^(quiz|flashcard|summary)$"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get content performance metrics
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    results = []
    
    if not content_type or content_type == "quiz":
        quizzes = db.query(
            QuizQuestionModel.id,
            QuizQuestionModel.title,
            QuizQuestionModel.created_at,
            func.count(ProgressModel.id).label('attempts'),
            func.avg(ProgressModel.score).label('avg_score')
        ).outerjoin(
            ProgressModel, and_(
                ProgressModel.content_id == QuizQuestionModel.id,
                ProgressModel.content_type == 'quiz'
            )
        ).group_by(
            QuizQuestionModel.id
        ).all()
        
        for quiz in quizzes:
            results.append({
                "type": "quiz",
                "id": quiz.id,
                "title": quiz.title,
                "created_at": quiz.created_at,
                "attempts": quiz.attempts,
                "avg_score": float(quiz.avg_score) if quiz.avg_score else 0
            })
    
    return results


@router.get("/reports/export/users")
def export_users_csv(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Export all users to CSV
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    users = db.query(UserModel).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow([
        "ID", "Email", "Username", "Full Name", "Role", 
        "Active", "Created At", "Last Login"
    ])
    
    # Write user data
    for user in users:
        writer.writerow([
            user.id,
            user.email,
            user.username or "",
            user.full_name or "",
            user.role,
            "Yes" if user.is_active else "No",
            user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else "",
            user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=users_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@router.get("/reports/export/content")
def export_content_csv(
    content_type: str = Query(..., regex="^(quiz|flashcard|summary)$"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Export content to CSV
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    if content_type == "quiz":
        # Write headers
        writer.writerow([
            "ID", "Title", "Description", "Chapter", "Created By", "Created At"
        ])
        
        quizzes = db.query(QuizQuestionModel).all()
        for quiz in quizzes:
            writer.writerow([
                quiz.id,
                quiz.title,
                quiz.description or "",
                quiz.chapter.title if quiz.chapter else "",
                quiz.created_by.username if quiz.created_by else "System",
                quiz.created_at.strftime("%Y-%m-%d %H:%M:%S") if quiz.created_at else ""
            ])
    
    elif content_type == "flashcard":
        # Write headers
        writer.writerow([
            "ID", "Front", "Back", "Chapter", "Created By", "Created At"
        ])
        
        flashcards = db.query(FlashcardModel).all()
        for card in flashcards:
            writer.writerow([
                card.id,
                card.front,
                card.back,
                card.chapter.title if card.chapter else "",
                card.created_by.username if card.created_by else "System",
                card.created_at.strftime("%Y-%m-%d %H:%M:%S") if card.created_at else ""
            ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={content_type}_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@router.get("/reports/system-health")
def get_system_health(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get system health metrics
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    # Database size metrics
    table_sizes = {}
    tables = ['users', 'quizzes', 'flashcards', 'chapter_summaries', 'user_progress']
    
    for table in tables:
        count = db.execute(f"SELECT COUNT(*) FROM {table}").scalar()
        table_sizes[table] = count
    
    # Recent errors/issues (placeholder - would need error tracking)
    recent_errors = []
    
    # System usage in last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    active_users_24h = db.query(func.count(func.distinct(ProgressModel.user_id))).filter(
        ProgressModel.last_accessed >= yesterday
    ).scalar() or 0
    
    return {
        "database": {
            "table_sizes": table_sizes,
            "total_records": sum(table_sizes.values())
        },
        "activity": {
            "active_users_24h": active_users_24h
        },
        "errors": recent_errors,
        "status": "healthy"
    }