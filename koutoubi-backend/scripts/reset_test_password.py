#!/usr/bin/env python3
"""Script to reset the test user password"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def reset_test_password():
    db = SessionLocal()
    
    try:
        # Find test user
        test_user = db.query(User).filter_by(email="test@koutoubi.ai").first()
        if not test_user:
            print("User not found: test@koutoubi.ai")
            return
        
        # Reset password
        test_user.hashed_password = get_password_hash("test123")
        db.commit()
        
        print(f"Password reset successfully!")
        print(f"Email: test@koutoubi.ai")
        print(f"Password: test123")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_test_password()