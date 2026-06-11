import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_create_task_unauthorized(client: AsyncClient):
    response = await client.post("/tasks/", json={
        "title": "Test Task",
        "description": "Test Description",
        "status": "todo",
        "priority": "medium",
        "due_date": None
    })
    assert response.status_code == 401
    assert "detail" in response.json()

async def test_create_task_authorized(client: AsyncClient):
    # Register a new user to obtain token
    signup_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123"
    }
    signup_resp = await client.post("/auth/signup", json=signup_data)
    assert signup_resp.status_code == 201
    
    token_data = signup_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Create a task with valid token
    headers = {"Authorization": f"Bearer {token}"}
    task_payload = {
        "title": "Test Task Authorized",
        "description": "This task is created by an authorized user.",
        "status": "todo",
        "priority": "medium",
        "due_date": "2026-06-20"
    }
    response = await client.post("/tasks/", json=task_payload, headers=headers)
    assert response.status_code == 201
    
    created_task = response.json()
    assert created_task["title"] == task_payload["title"]
    assert created_task["description"] == task_payload["description"]
    assert created_task["status"] == task_payload["status"]
    assert created_task["priority"] == task_payload["priority"]
    assert created_task["due_date"] == task_payload["due_date"]
    assert "id" in created_task
