from pydantic import BaseModel, Field
from typing import Optional, List, Any, Union
from datetime import datetime
from app.schemas.user import UserResponse

class QuestionBase(BaseModel):
    order: int = 1
    type: str  # PICTURE_DESCRIPTION, WRITING, VOCABULARY, TRANSLATION, MULTIPLE_CHOICE, etc.
    question_text: str
    description: Optional[str] = None
    passage: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    media_duration: Optional[float] = None
    transcript: Optional[str] = None
    options: Optional[Any] = None  # JSON array or dict
    correct_answer: Optional[Any] = None
    min_words: Optional[int] = None
    max_words: Optional[int] = None
    points: float = 1.0
    is_required: bool = True

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: str
    assignment_id: str

    class Config:
        from_attributes = True

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    type: str = "WRITING"
    difficulty: str = "Intermediate"
    points: float = 10.0
    estimated_time_minutes: int = 15
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    allow_late_submission: bool = True
    allow_edit_after_submit: bool = False
    audio_play_limit: int = 0  # 0 = unlimited
    show_transcript: bool = False
    target_type: str = "ALL"  # ALL, GROUP, INDIVIDUAL
    target_group_id: Optional[str] = None
    selected_student_ids: Optional[List[str]] = None

class AssignmentCreate(AssignmentBase):
    status: str = "PUBLISHED"  # DRAFT or PUBLISHED
    questions: List[QuestionCreate] = []

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    type: Optional[str] = None
    difficulty: Optional[str] = None
    points: Optional[float] = None
    estimated_time_minutes: Optional[int] = None
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    allow_late_submission: Optional[bool] = None
    allow_edit_after_submit: Optional[bool] = None
    audio_play_limit: Optional[int] = None
    show_transcript: Optional[bool] = None
    status: Optional[str] = None
    target_type: Optional[str] = None
    target_group_id: Optional[str] = None
    questions: Optional[List[QuestionCreate]] = None
    selected_student_ids: Optional[List[str]] = None

class AssignmentResponse(AssignmentBase):
    id: str
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = "Teacher"
    status: str
    created_at: datetime
    updated_at: datetime
    submissions_count: int = 0
    questions_count: int = 0
    
    # Student specific status when requested by a student
    student_status: Optional[str] = None  # NEW, IN PROGRESS, SUBMITTED, REVIEWING, GRADED, LATE, MISSED
    student_score: Optional[float] = None
    student_progress_percent: Optional[int] = 0

    class Config:
        from_attributes = True

class AssignmentDetailResponse(AssignmentResponse):
    questions: List[QuestionResponse] = []
    teacher: Optional[UserResponse] = None
