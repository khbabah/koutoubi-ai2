"""Add current_interval column to user_progress

Revision ID: add_interval_column
Revises: 
Create Date: 2024-06-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_interval_column'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add current_interval column to user_progress table
    op.add_column('user_progress', sa.Column('current_interval', sa.Integer(), nullable=True, default=1))


def downgrade():
    # Remove current_interval column from user_progress table
    op.drop_column('user_progress', 'current_interval')