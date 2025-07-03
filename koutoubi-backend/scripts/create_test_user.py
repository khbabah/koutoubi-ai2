#!/usr/bin/env python3
"""Script to create a test user in the database"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_test_user():
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter_by(email="test@koutoubi.ai").first()
        if existing_user:
            print(f"User already exists: {existing_user.email}")
            return
        
        # Create test user
        test_user = User(
            email="test@koutoubi.ai",
            username="test",
            full_name="Test User",
            hashed_password=get_password_hash("test123"),
            is_active=True,
            role="student"
        )
        
        db.add(test_user)
        db.commit()
        
        print(f"Test user created successfully!")
        print(f"Email: test@koutoubi.ai")
        print(f"Password: test123")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()