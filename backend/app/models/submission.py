import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Status: DRAFT, SUBMITTED, REVIEWING, GRADED, RETURNED
    status = Column(String(30), default="DRAFT", nullable=False, index=True)
    
    is_late = Column(Boolean, default=False, nullable=False)
    late_by_minutes = Column(Integer, default=0, nullable=False)
    
    submitted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    total_score = Column(Float, nullable=True)
    max_score = Column(Float, default=10.0, nullable=False)
    
    graded_at = Column(DateTime(timezone=True), nullable=True)
    graded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    teacher_feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id], back_populates="submissions")
    grader = relationship("User", foreign_keys=[graded_by])
    answers = relationship("SubmissionAnswer", back_populates="submission", cascade="all, delete-orphan")

class SubmissionAnswer(Base):
    __tablename__ = "submission_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("assignment_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Answers by type
    text_answer = Column(Text, nullable=True)
    selected_options = Column(JSON, nullable=True)  # string or array or mapping
    audio_url = Column(String(500), nullable=True)   # for speaking
    audio_duration = Column(Float, nullable=True)
    file_url = Column(String(500), nullable=True)    # for photo homework
    word_count = Column(Integer, nullable=True)
    
    # Audio plays tracking for listening tasks
    audio_plays_count = Column(Integer, default=0, nullable=False)
    
    # Scoring
    auto_score = Column(Float, nullable=True)
    manual_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)

    submission = relationship("Submission", back_populates="answers")
    question = relationship("AssignmentQuestion", back_populates="answers")

    @property
    def final_score(self) -> float:
        if self.manual_score is not None:
            return self.manual_score
        return self.auto_score if self.auto_score is not None else 0.0
