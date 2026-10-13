from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardStats(BaseModel):
    total_students: int
    active_assignments: int
    pending_reviews: int
    completed_today: int
    average_score: float
    completion_rate: float
    late_submissions: int

class CategoryProgress(BaseModel):
    category: str  # Grammar, Vocabulary, Writing, Reading, Listening, Speaking
    score: float
    total_tasks: int

class StudentProgressStats(BaseModel):
    student_id: str
    student_name: str
    total_assignments: int
    completed: int
    pending: int
    late: int
    average_score: float
    completion_rate: float
    skills_radar: List[CategoryProgress] = []

class AnalyticsData(BaseModel):
    dashboard_stats: DashboardStats
    skills_overview: List[CategoryProgress]
    recent_performance: List[Dict[str, Any]]
