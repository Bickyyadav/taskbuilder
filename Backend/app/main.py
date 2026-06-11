from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.routers import user_router, tasks, auth
from app.config import FRONTEND_URL
from contextlib import asynccontextmanager
import asyncio
from alembic.config import Config
from alembic import command
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_upgrade():
    logger.info("Running database migrations...")
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully.")
    except Exception as e:
        logger.error(f"Failed to run database migrations: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run migrations programmatically on startup in a separate thread
    await asyncio.to_thread(run_upgrade)
    yield
    # Cleanup connection pool
    await engine.dispose()

app = FastAPI(
    title="Taskly API",
    description="Taskly backend with automated migrations and custom error handlers",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = {
    "http://localhost:3000",
    FRONTEND_URL
}
# Filter out empty origins
origins = [o for o in origins if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Validation Error Handler matching the standard FastAPI detail structure
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = {}
    for error in exc.errors():
        loc = error.get("loc")
        field = loc[-1] if loc else "unknown"
        msg = error.get("msg")
        errors[str(field)] = msg
        
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors}
    )

# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

# Include routers
app.include_router(auth.router, prefix="/auth")
app.include_router(tasks.router, prefix="/tasks")
app.include_router(user_router.router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Welcome to the Taskly API. Go to /docs for Swagger documentation."}
