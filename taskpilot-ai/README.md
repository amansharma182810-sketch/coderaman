# TaskPilot AI

A Serval-inspired AI operations workspace starter. The frontend includes a responsive workflow studio, animated CSS 3D orb, workflow proposals, approval checkpoints, and a safe demo runner.

## Structure
- `apps/web`: Next.js 14 + React + TypeScript + Lucide
- `apps/api`: FastAPI + SQLite demo persistence

## Run locally
### API
```bash
cd apps/api
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
### Web (new terminal)
```bash
cd apps/web
npm install
npm run dev
```
Open http://localhost:3000. API docs: http://localhost:8000/docs.

## Deploy
- Vercel frontend Root Directory: `taskpilot-ai/apps/web` (if importing the existing repository).
- Set `NEXT_PUBLIC_API_URL` to the public HTTPS URL of the FastAPI service when deployed.
- Deploy `apps/api` as a Python service on Railway or another ASGI host; start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Configure `TASKPILOT_CORS_ORIGINS` with the deployed frontend origin.

## Safety and maturity
The current planner is a deterministic demo, and the run endpoint only simulates execution. It does not call external business systems. Before production, add authentication, tenant isolation, durable managed PostgreSQL, secrets management, RBAC, audit logging, rate limits, real integration adapters, and human approval policies. Do not place provider API keys in frontend variables.
