#!/usr/bin/env python3
"""
Migration script to add educational content tables
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models import educational_content

def migrate():
    """Create educational content tables if they don't exist"""
    print("Creating educational content tables...")
    
    # Create all tables defined in the educational_content model
    Base.metadata.create_all(bind=engine)
    
    print("Educational content tables created successfully!")

if __name__ == "__main__":
    migrate()