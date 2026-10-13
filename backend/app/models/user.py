import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    telegram_id = Column(BigInteger, unique=True, nullable=True, index=True)
    login = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    username = Column(String(255), nullable=True, index=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=True)
    role = Column(String(32), default="STUDENT", nullable=False, index=True)  # STUDENT, TEACHER, ADMIN
    status = Column(String(32), default="ACTIVE", nullable=False, index=True)  # ACTIVE, DISABLED, PENDING
    phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    language_code = Column(String(10), default="en", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by_teacher_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    created_by = relationship("User", remote_side=[id], backref="created_students")
    group_memberships = relationship("GroupMember", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan", foreign_keys="[Submission.student_id]")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    assigned_targets = relationship("AssignmentTarget", back_populates="student", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name
