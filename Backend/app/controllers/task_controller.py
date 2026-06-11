from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, desc, asc
from typing import List, Optional, Tuple
import uuid
from app.models import Task
from app.schemas import TaskCreate, TaskUpdate

async def get_tasks(
    db: AsyncSession,
    user_id: uuid.UUID,
    page: int = 1,
    limit: int = 10,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> Tuple[List[Task], int]:
    offset = (page - 1) * limit
    
    # Base query for user's tasks
    query = select(Task).where(Task.user_id == user_id)
    
    # Filters
    if status:
        query = query.where(Task.status == status)
    if search:
        query = query.where(Task.title.ilike(f"%{search}%"))
        
    # Sorting
    sort_col = getattr(Task, sort_by, Task.created_at)
    if sort_order == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))
        
    # Count query with filters
    count_query = select(func.count()).select_from(Task).where(Task.user_id == user_id)
    if status:
        count_query = count_query.where(Task.status == status)
    if search:
        count_query = count_query.where(Task.title.ilike(f"%{search}%"))
        
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Paging execution
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())
    
    return items, total

async def get_task_by_id_raw(db: AsyncSession, task_id: uuid.UUID) -> Optional[Task]:
    result = await db.execute(select(Task).where(Task.id == task_id))
    return result.scalars().first()

async def create_task(db: AsyncSession, task_in: TaskCreate, user_id: uuid.UUID) -> Task:
    db_task = Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        due_date=task_in.due_date,
        user_id=user_id
    )
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

async def update_task(db: AsyncSession, db_task: Task, task_in: TaskUpdate) -> Task:
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
        
    await db.commit()
    await db.refresh(db_task)
    return db_task

async def delete_task(db: AsyncSession, db_task: Task) -> None:
    await db.delete(db_task)
    await db.commit()
