from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserResponse

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    level: str = "A2 Elementary"

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None

class GroupResponse(GroupBase):
    id: str
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True

class GroupDetailResponse(GroupResponse):
    students: List[UserResponse] = []
