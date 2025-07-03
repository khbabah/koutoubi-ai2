"""Add mindmap table

Revision ID: add_mindmap_table
Revises: add_interval_column
Create Date: 2025-06-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_mindmap_table'
down_revision = 'add_interval_column'
branch_labels = None
depends_on = None


def upgrade():
    # Create mindmaps table
    op.create_table('mindmaps',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('pdf_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('markdown', sa.Text(), nullable=True),
        sa.Column('version', sa.Integer(), server_default='1', nullable=True),
        sa.Column('is_ai_generated', sa.Boolean(), server_default='1', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mindmaps_id'), 'mindmaps', ['id'], unique=False)
    op.create_index(op.f('ix_mindmaps_pdf_id'), 'mindmaps', ['pdf_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_mindmaps_pdf_id'), table_name='mindmaps')
    op.drop_index(op.f('ix_mindmaps_id'), table_name='mindmaps')
    op.drop_table('mindmaps')