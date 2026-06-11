import os
from dotenv import load_dotenv

# Load .env from backend or root directory
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/task_db")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Clean parameters for asyncpg compatibility
if "sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("sslmode=require", "ssl=require")
    DATABASE_URL = DATABASE_URL.replace("sslmode=disable", "ssl=disable")
    DATABASE_URL = DATABASE_URL.replace("sslmode=allow", "ssl=allow")
    DATABASE_URL = DATABASE_URL.replace("sslmode=prefer", "ssl=prefer")

if "channel_binding=" in DATABASE_URL:
    import re
    DATABASE_URL = re.sub(r'[&?]channel_binding=[^&]+', '', DATABASE_URL)

# Bypass Neon transaction pooler to prevent Alembic/asyncpg transaction issues
if "-pooler" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("-pooler", "")

JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkeythatisverysafe1234567890!")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
