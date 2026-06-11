# Task Management Monorepo

This project is structured as a monorepo containing a Next.js (TypeScript + Tailwind CSS) frontend and a FastAPI (Python) backend.

## Structure
- `/backend`: FastAPI Python backend using a clean MVC (Model-Controller-Routes) structure without classes.
- `/frontend`: Next.js 14 frontend.

## Environment Setup
Copy `.env.example` to the respective environment configurations or root:
```bash
cp .env.example .env
```

## Running the Backend
1. Navigate to `/backend`
2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Running the Frontend
1. Navigate to `/frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
