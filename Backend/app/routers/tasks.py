from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional
from app.database import get_db
from app.schemas import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
from app.controllers import task_controller
from app.security import get_current_user
from app.models import User

router = APIRouter(tags=["Tasks"])

# Helper function to get a task and verify ownership
async def get_and_verify_task(db: AsyncSession, task_id: UUID, user_id: UUID):
    task = await task_controller.get_task_by_id_raw(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this task"
        )
    return task

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_new_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await task_controller.create_task(db, task_in, current_user.id)

@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    status: Optional[str] = Query(None, description="Filter tasks by status"),
    search: Optional[str] = Query(None, description="Search tasks by title (case-insensitive)"),
    sort_by: str = Query("created_at", description="Sort by: due_date, priority, created_at"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    items, total = await task_controller.get_tasks(
        db, 
        current_user.id, 
        page=page, 
        limit=limit,
        status=status,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_and_verify_task(db, task_id, current_user.id)

@router.patch("/{task_id}", response_model=TaskResponse)
async def patch_task(
    task_id: UUID,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = await get_and_verify_task(db, task_id, current_user.id)
    return await task_controller.update_task(db, task, task_in)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = await get_and_verify_task(db, task_id, current_user.id)
    await task_controller.delete_task(db, task)
    return None
