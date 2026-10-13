from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.schemas.user import UserResponse
from app.schemas.assignment import AssignmentResponse, QuestionResponse

class AnswerInput(BaseModel):
    question_id: str
    text_answer: Optional[str] = None
    selected_options: Optional[Any] = None
    audio_url: Optional[str] = None
    audio_duration: Optional[float] = None
    file_url: Optional[str] = None
    word_count: Optional[int] = None
    audio_plays_count: Optional[int] = 0

class AnswerResponse(AnswerInput):
    id: str
    submission_id: str
    auto_score: Optional[float] = None
    manual_score: Optional[float] = None
    feedback: Optional[str] = None
    question: Optional[QuestionResponse] = None

    class Config:
        from_attributes = True

class DraftSaveRequest(BaseModel):
    answers: List[AnswerInput] = []

class SubmitRequest(BaseModel):
    answers: List[AnswerInput] = []

class AnswerGradeInput(BaseModel):
    question_id: str
    score: float
    feedback: Optional[str] = None

class SubmissionGradeRequest(BaseModel):
    total_score: float
    teacher_feedback: Optional[str] = None
    status: str = "GRADED"  # GRADED, REVIEWING, RETURNED
    question_grades: Optional[List[AnswerGradeInput]] = None

class SubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    assignment_title: Optional[str] = None
    student_id: str
    student: Optional[UserResponse] = None
    status: str  # DRAFT, SUBMITTED, REVIEWING, GRADED, RETURNED
    is_late: bool = False
    late_by_minutes: int = 0
    submitted_at: Optional[datetime] = None
    total_score: Optional[float] = None
    max_score: float = 10.0
    graded_at: Optional[datetime] = None
    teacher_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubmissionDetailResponse(SubmissionResponse):
    assignment: Optional[AssignmentResponse] = None
    answers: List[AnswerResponse] = []
