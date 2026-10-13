"""Lessons schema

Revision ID: b20260924_lessons
Revises: 4ba8ca7b58ce
Create Date: 2026-09-24 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b20260924_lessons'
down_revision: Union[str, None] = '4ba8ca7b58ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'lessons',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('teacher_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('media_type', sa.String(length=50), nullable=True),
        sa.Column('media_url', sa.String(length=500), nullable=True),
        sa.Column('media_duration', sa.Float(), nullable=True),
        sa.Column('vocabulary', sa.JSON(), nullable=True),
        sa.Column('exercises', sa.JSON(), nullable=True),
        sa.Column('attached_assignment_id', sa.String(length=36), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('target_type', sa.String(length=20), nullable=False),
        sa.Column('target_group_id', sa.String(length=36), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('estimated_time_minutes', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['attached_assignment_id'], ['assignments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_group_id'], ['groups.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lessons_status'), 'lessons', ['status'], unique=False)
    op.create_index(op.f('ix_lessons_teacher_id'), 'lessons', ['teacher_id'], unique=False)
    op.create_index(op.f('ix_lessons_attached_assignment_id'), 'lessons', ['attached_assignment_id'], unique=False)

    op.create_table(
        'lesson_progress',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('lesson_id', sa.String(length=36), nullable=False),
        sa.Column('student_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('progress_percent', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lesson_progress_lesson_id'), 'lesson_progress', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_lesson_progress_student_id'), 'lesson_progress', ['student_id'], unique=False)
    op.create_index(op.f('ix_lesson_progress_status'), 'lesson_progress', ['status'], unique=False)

    op.create_table(
        'lesson_targets',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('lesson_id', sa.String(length=36), nullable=False),
        sa.Column('student_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lesson_targets_lesson_id'), 'lesson_targets', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_lesson_targets_student_id'), 'lesson_targets', ['student_id'], unique=False)

def downgrade() -> None:
    op.drop_table('lesson_targets')
    op.drop_table('lesson_progress')
    op.drop_table('lessons')
