import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(36), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class VocabularyItem(Base):
    __tablename__ = "vocabulary_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    word = Column(String(100), nullable=False, index=True)
    translation = Column(String(255), nullable=False)
    definition = Column(Text, nullable=True)
    part_of_speech = Column(String(50), nullable=True)  # noun, verb, adjective, etc.
    example_sentence = Column(Text, nullable=True)
    difficulty = Column(String(50), default="Intermediate", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
