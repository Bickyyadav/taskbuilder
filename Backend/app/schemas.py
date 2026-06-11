from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional, List, Literal
from uuid import UUID

# User schemas
class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="Must be a valid email address")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Task schemas
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100, description="Title must be at least 3 characters long")
    description: Optional[str] = Field(None, description="Optional description of the task")
    status: Literal["todo", "in_progress", "done"] = Field("todo", description="Status must be: todo, in_progress, done")
    priority: Literal["low", "medium", "high"] = Field("medium", description="Priority must be: low, medium, high")
    due_date: Optional[date] = Field(None, description="Optional due date (YYYY-MM-DD)")

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100, description="Title must be at least 3 characters")
    description: Optional[str] = None
    status: Optional[Literal["todo", "in_progress", "done"]] = None
    priority: Optional[Literal["low", "medium", "high"]] = None
    due_date: Optional[date] = None

class TaskResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str]
    status: Literal["todo", "in_progress", "done"]
    priority: Literal["low", "medium", "high"]
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    page: int
    limit: int
