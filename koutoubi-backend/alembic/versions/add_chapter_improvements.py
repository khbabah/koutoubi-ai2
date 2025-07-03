"""add chapter improvements

Revision ID: add_chapter_improvements
Revises: add_mindmap_table
Create Date: 2024-01-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_chapter_improvements'
down_revision = 'add_mindmap_table'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to chapters table
    op.add_column('chapters', sa.Column('course_id', sa.String(), nullable=True))
    op.add_column('chapters', sa.Column('order', sa.Integer(), nullable=True))
    op.add_column('chapters', sa.Column('prerequisites', sa.JSON(), nullable=True))
    op.add_column('chapters', sa.Column('description', sa.Text(), nullable=True))
    
    # Add chapter_id to mindmaps table for chapter-level mindmaps
    op.add_column('mindmaps', sa.Column('chapter_id', sa.String(), nullable=True))
    op.add_column('mindmaps', sa.Column('level', sa.String(), nullable=True))
    
    # Create index for course_id
    op.create_index('ix_chapters_course_id', 'chapters', ['course_id'])
    
    # Update existing chapters with course_id
    op.execute("""
        UPDATE chapters 
        SET course_id = niveau || '-' || 
                       CASE 
                           WHEN niveau = 'secondaire1' THEN 
                               CASE numero
                                   WHEN 1 THEN '1ere'
                                   WHEN 2 THEN '2eme'
                                   WHEN 3 THEN '3eme'
                               END
                           WHEN niveau = 'secondaire2' THEN 
                               CASE numero
                                   WHEN 4 THEN '4eme'
                                   WHEN 5 THEN '5eme'
                                   WHEN 6 THEN '6eme'
                                   WHEN 7 THEN '7eme'
                               END
                       END || '-' || matiere,
            order = numero
        WHERE course_id IS NULL
    """)
    
    # Set level for existing mindmaps
    op.execute("UPDATE mindmaps SET level = 'course' WHERE level IS NULL")


def downgrade():
    op.drop_index('ix_chapters_course_id', 'chapters')
    op.drop_column('chapters', 'course_id')
    op.drop_column('chapters', 'order')
    op.drop_column('chapters', 'prerequisites')
    op.drop_column('chapters', 'description')
    op.drop_column('mindmaps', 'chapter_id')
    op.drop_column('mindmaps', 'level')