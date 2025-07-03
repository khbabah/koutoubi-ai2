#!/usr/bin/env python3
"""
Script de gestion des utilisateurs pour Koutoubi AI
Usage: python manage_users.py [command] [options]
"""
import sys
import os
import argparse
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.core.security import get_password_hash, verify_password
from app.core.config import settings
from app.core.constants import UserRole
from rich.console import Console
from rich.table import Table
from rich.prompt import Prompt, Confirm

console = Console()

# Create database session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def list_users(role=None, email_filter=None):
    """List all users in the database"""
    db = SessionLocal()
    
    try:
        query = db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        if email_filter:
            query = query.filter(User.email.contains(email_filter))
            
        users = query.all()
        
        # Create table
        table = Table(title="Koutoubi AI Users")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Email", style="magenta")
        table.add_column("Username", style="green")
        table.add_column("Role", style="yellow")
        table.add_column("Active", style="blue")
        table.add_column("Created", style="white")
        
        for user in users:
            table.add_row(
                user.id[:8] + "...",
                user.email,
                user.username or "N/A",
                user.role,
                "✅" if user.is_active else "❌",
                user.created_at.strftime("%Y-%m-%d") if user.created_at else "N/A"
            )
        
        console.print(table)
        console.print(f"\nTotal users: {len(users)}")
        
    finally:
        db.close()


def reset_password(email, new_password=None):
    """Reset user password"""
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            console.print(f"[red]❌ User with email '{email}' not found[/red]")
            return False
        
        if not new_password:
            new_password = Prompt.ask(f"Enter new password for {email}", password=True)
            confirm_password = Prompt.ask("Confirm password", password=True)
            
            if new_password != confirm_password:
                console.print("[red]❌ Passwords do not match[/red]")
                return False
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        
        console.print(f"[green]✅ Password updated for {email}[/green]")
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Error: {str(e)}[/red]")
        db.rollback()
        return False
    finally:
        db.close()


def reset_test_accounts():
    """Reset all test account passwords"""
    test_accounts = [
        ("admin@koutoubi.ai", "Admin123!", "super_admin"),
        ("teacher@koutoubi.ai", "Teacher123!", "teacher"),
        ("student@koutoubi.ai", "Student123!", "student"),
        ("parent@koutoubi.ai", "Parent123!", "parent"),
        ("test@koutoubi.ai", "Test123!", "student"),
    ]
    
    console.print("[bold]Resetting test account passwords...[/bold]\n")
    
    db = SessionLocal()
    try:
        for email, password, expected_role in test_accounts:
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                # Update password
                user.hashed_password = get_password_hash(password)
                # Ensure user is active
                user.is_active = True
                # Update role if needed
                if user.role != expected_role:
                    user.role = expected_role
                    console.print(f"[yellow]⚠️  Updated role for {email} to {expected_role}[/yellow]")
                
                db.commit()
                console.print(f"[green]✅ {email:<30} password: {password}[/green]")
            else:
                console.print(f"[red]❌ {email:<30} not found[/red]")
        
        db.commit()
        
        # Print summary
        console.print("\n[bold]Test Accounts Summary:[/bold]")
        table = Table()
        table.add_column("Type", style="cyan")
        table.add_column("Email", style="magenta")
        table.add_column("Password", style="green")
        table.add_column("Access", style="yellow")
        
        table.add_row("Admin", "admin@koutoubi.ai", "Admin123!", "/admin")
        table.add_row("Teacher", "teacher@koutoubi.ai", "Teacher123!", "/dashboard")
        table.add_row("Student", "student@koutoubi.ai", "Student123!", "/dashboard")
        table.add_row("Parent", "parent@koutoubi.ai", "Parent123!", "/dashboard")
        table.add_row("Test", "test@koutoubi.ai", "Test123!", "/dashboard")
        
        console.print(table)
        
    except Exception as e:
        console.print(f"[red]❌ Error: {str(e)}[/red]")
        db.rollback()
    finally:
        db.close()


def create_user(email, password, role, username=None):
    """Create a new user"""
    db = SessionLocal()
    
    try:
        # Check if user exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            console.print(f"[red]❌ User with email '{email}' already exists[/red]")
            return False
        
        # Validate role
        if role not in UserRole.get_all_roles():
            console.print(f"[red]❌ Invalid role. Must be one of: {', '.join(UserRole.get_all_roles())}[/red]")
            return False
        
        # Create user
        user = User(
            email=email,
            username=username or email.split('@')[0],
            hashed_password=get_password_hash(password),
            role=role,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        
        console.print(f"[green]✅ Created user: {email} with role: {role}[/green]")
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Error: {str(e)}[/red]")
        db.rollback()
        return False
    finally:
        db.close()


def verify_password_for_user(email):
    """Verify password for a specific user"""
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            console.print(f"[red]❌ User with email '{email}' not found[/red]")
            return
        
        password = Prompt.ask(f"Enter password to verify for {email}", password=True)
        
        if verify_password(password, user.hashed_password):
            console.print(f"[green]✅ Password is correct for {email}[/green]")
        else:
            console.print(f"[red]❌ Password is incorrect for {email}[/red]")
            
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Koutoubi AI User Management")
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # List users command
    list_parser = subparsers.add_parser('list', help='List users')
    list_parser.add_argument('--role', help='Filter by role')
    list_parser.add_argument('--email', help='Filter by email (partial match)')
    
    # Reset password command
    reset_parser = subparsers.add_parser('reset-password', help='Reset user password')
    reset_parser.add_argument('email', help='User email')
    reset_parser.add_argument('--password', help='New password (will prompt if not provided)')
    
    # Reset test accounts
    subparsers.add_parser('reset-test', help='Reset all test account passwords')
    
    # Create user command
    create_parser = subparsers.add_parser('create', help='Create new user')
    create_parser.add_argument('email', help='User email')
    create_parser.add_argument('role', help='User role', choices=UserRole.get_all_roles())
    create_parser.add_argument('--password', help='Password (will prompt if not provided)')
    create_parser.add_argument('--username', help='Username')
    
    # Verify password
    verify_parser = subparsers.add_parser('verify', help='Verify user password')
    verify_parser.add_argument('email', help='User email')
    
    args = parser.parse_args()
    
    if args.command == 'list':
        list_users(role=args.role, email_filter=args.email)
    elif args.command == 'reset-password':
        reset_password(args.email, args.password)
    elif args.command == 'reset-test':
        reset_test_accounts()
    elif args.command == 'create':
        password = args.password or Prompt.ask("Password", password=True)
        create_user(args.email, password, args.role, args.username)
    elif args.command == 'verify':
        verify_password_for_user(args.email)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()