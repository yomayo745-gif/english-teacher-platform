from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class VocabularyItemSchema(BaseModel):
    word: str
    phonetic: Optional[str] = None
    translation: str
    example: Optional[str] = None

class ExerciseSchema(BaseModel):
    id: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: Any

class LessonCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    media_type: Optional[str] = "none"
    media_url: Optional[str] = None
    media_duration: Optional[float] = None
    vocabulary: Optional[List[dict]] = None
    exercises: Optional[List[dict]] = None
    attached_assignment_id: Optional[str] = None
    order: int = 1
    target_type: str = "ALL"
    target_group_id: Optional[str] = None
    target_student_ids: Optional[List[str]] = None
    status: str = "PUBLISHED"
    estimated_time_minutes: int = 20

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    media_duration: Optional[float] = None
    vocabulary: Optional[List[dict]] = None
    exercises: Optional[List[dict]] = None
    attached_assignment_id: Optional[str] = None
    order: Optional[int] = None
    target_type: Optional[str] = None
    target_group_id: Optional[str] = None
    target_student_ids: Optional[List[str]] = None
    status: Optional[str] = None
    estimated_time_minutes: Optional[int] = None

class LessonProgressUpdate(BaseModel):
    status: str = "IN_PROGRESS"  # IN_PROGRESS, COMPLETED
    progress_percent: int = 100
    notes: Optional[str] = None

class AttachedAssignmentSummary(BaseModel):
    id: str
    title: str
    type: str
    points: float
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    score: Optional[float] = None

class LessonResponse(BaseModel):
    id: str
    teacher_id: Optional[str]
    title: str
    description: Optional[str]
    content: Optional[str]
    media_type: Optional[str]
    media_url: Optional[str]
    media_duration: Optional[float]
    vocabulary: Optional[List[dict]]
    exercises: Optional[List[dict]]
    attached_assignment_id: Optional[str]
    order: int
    target_type: str
    target_group_id: Optional[str]
    status: str
    estimated_time_minutes: int
    created_at: datetime
    updated_at: datetime
    attached_assignment: Optional[AttachedAssignmentSummary] = None

    class Config:
        from_attributes = True

class StudentLessonListItem(BaseModel):
    id: str
    order: int
    title: str
    description: Optional[str]
    media_type: Optional[str]
    estimated_time_minutes: int
    has_audio: bool
    has_vocabulary: bool
    has_exercises: bool
    attached_assignment_id: Optional[str] = None
    attached_assignment_title: Optional[str] = None
    student_status: str = "NOT_STARTED"  # NOT_STARTED, IN_PROGRESS, COMPLETED
    progress_percent: int = 0
    completed_at: Optional[datetime] = None

class StudentLessonDetail(BaseModel):
    id: str
    order: int
    title: str
    description: Optional[str]
    content: Optional[str]
    media_type: Optional[str]
    media_url: Optional[str]
    media_duration: Optional[float]
    vocabulary: Optional[List[dict]]
    exercises: Optional[List[dict]]
    estimated_time_minutes: int
    student_status: str = "IN_PROGRESS"
    progress_percent: int = 0
    completed_at: Optional[datetime] = None
    attached_assignment: Optional[AttachedAssignmentSummary] = None
