import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)  # Markdown theory & explanations
    
    # Media: audio lecture, video embed link, or image
    media_type = Column(String(50), nullable=True, default="none")  # audio, video, image, none
    media_url = Column(String(500), nullable=True)
    media_duration = Column(Float, nullable=True)

    # Vocabulary items: [{"word": "abundant", "phonetic": "/əˈbʌn.dənt/", "translation": "mo‘l-ko‘l", "example": "Rain is abundant in spring."}]
    vocabulary = Column(JSON, nullable=True)

    # Interactive exercises: [{"id": "q1", "question": "...", "options": [...], "correct_answer": "..."}]
    exercises = Column(JSON, nullable=True)

    # Attached homework (connects to Assignment engine)
    attached_assignment_id = Column(String(36), ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True, index=True)

    order = Column(Integer, default=1, nullable=False)
    target_type = Column(String(20), default="ALL", nullable=False)  # ALL, GROUP, INDIVIDUAL
    target_group_id = Column(String(36), ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(20), default="PUBLISHED", nullable=False, index=True)  # DRAFT, PUBLISHED
    estimated_time_minutes = Column(Integer, default=20, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    target_group = relationship("Group", foreign_keys=[target_group_id])
    attached_assignment = relationship("Assignment", foreign_keys=[attached_assignment_id])
    progress_records = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
    targets = relationship("LessonTarget", back_populates="lesson", cascade="all, delete-orphan")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Status: NOT_STARTED, IN_PROGRESS, COMPLETED
    status = Column(String(20), default="IN_PROGRESS", nullable=False, index=True)
    progress_percent = Column(Integer, default=0, nullable=False)
    
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_accessed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    lesson = relationship("Lesson", back_populates="progress_records")
    student = relationship("User", foreign_keys=[student_id])


class LessonTarget(Base):
    __tablename__ = "lesson_targets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    lesson = relationship("Lesson", back_populates="targets")
    student = relationship("User", foreign_keys=[student_id])
