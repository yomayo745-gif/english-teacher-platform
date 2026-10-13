import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    
    # Task type: PICTURE_DESCRIPTION, WRITING, VOCABULARY, TRANSLATION, MULTIPLE_CHOICE, 
    # TRUE_FALSE, FILL_BLANK, MATCHING, SENTENCE_BUILDER, READING, LISTENING, SPEAKING, 
    # PHOTO, SHORT_ANSWER, or MIXED
    type = Column(String(50), nullable=False, default="WRITING")
    difficulty = Column(String(50), default="Intermediate", nullable=False)
    points = Column(Float, default=10.0, nullable=False)
    estimated_time_minutes = Column(Integer, default=15, nullable=False)
    
    start_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    
    allow_late_submission = Column(Boolean, default=True, nullable=False)
    allow_edit_after_submit = Column(Boolean, default=False, nullable=False)
    
    # Audio settings
    audio_play_limit = Column(Integer, default=0, nullable=False)  # 0 = unlimited, 1, 2, 3
    show_transcript = Column(Boolean, default=False, nullable=False)
    
    # Status: DRAFT, PUBLISHED, ARCHIVED
    status = Column(String(20), default="PUBLISHED", nullable=False, index=True)
    
    # Targeting: ALL, GROUP, INDIVIDUAL
    target_type = Column(String(20), default="ALL", nullable=False)
    target_group_id = Column(String(36), ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    target_group = relationship("Group", back_populates="assignments")
    questions = relationship("AssignmentQuestion", back_populates="assignment", cascade="all, delete-orphan", order_by="AssignmentQuestion.order")
    targets = relationship("AssignmentTarget", back_populates="assignment", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")

class AssignmentQuestion(Base):
    __tablename__ = "assignment_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    order = Column(Integer, default=1, nullable=False)
    type = Column(String(50), nullable=False)
    
    question_text = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    passage = Column(Text, nullable=True)  # Reading passage if type == READING
    
    media_url = Column(String(500), nullable=True)
    media_type = Column(String(50), nullable=True)  # audio, image, doc
    media_duration = Column(Float, nullable=True)
    transcript = Column(Text, nullable=True)
    
    # Options for choice / matching / sentence builder
    # Format for multiple choice: ["Option A", "Option B", "Option C"]
    # Format for matching: [{"left": "Apple", "right": "Fruit"}, ...]
    # Format for sentence builder: ["study", "English", "I", "every", "day"]
    options = Column(JSON, nullable=True)
    
    # Correct answer for auto-grading
    correct_answer = Column(JSON, nullable=True)
    
    # Word count limits for writing/picture description
    min_words = Column(Integer, nullable=True)
    max_words = Column(Integer, nullable=True)
    
    points = Column(Float, default=1.0, nullable=False)
    is_required = Column(Boolean, default=True, nullable=False)

    assignment = relationship("Assignment", back_populates="questions")
    answers = relationship("SubmissionAnswer", back_populates="question", cascade="all, delete-orphan")

class AssignmentTarget(Base):
    __tablename__ = "assignment_targets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    assignment = relationship("Assignment", back_populates="targets")
    student = relationship("User", back_populates="assigned_targets")
