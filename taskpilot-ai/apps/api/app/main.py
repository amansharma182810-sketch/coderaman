import os
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from . import database
from .schemas import GenerateRequest
from .planner import make_plan

app = FastAPI(title="TaskPilot AI API", version="0.2.0")
origins = [x.strip() for x in os.getenv("TASKPILOT_CORS_ORIGINS", "http://localhost:3000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])

@app.on_event("startup")
def startup():
    database.init_db()

@app.get("/api/health")
def health():
    return {"ok": True, "service": "taskpilot-api"}

@app.post("/api/workflows")
def create_workflow(body: GenerateRequest):
    title, steps = make_plan(body.prompt)
    item = {"id": str(uuid4()), "prompt": body.prompt, "title": title,
            "status": "awaiting_approval", "steps": steps,
            "created_at": datetime.now(timezone.utc).isoformat()}
    database.save_workflow(item)
    return item

@app.get("/api/workflows")
def workflows():
    return database.list_workflows()

@app.get("/api/workflows/{workflow_id}")
def workflow(workflow_id: str):
    item = database.get_workflow(workflow_id)
    if not item:
        raise HTTPException(404, "Workflow not found")
    return item

@app.post("/api/workflows/{workflow_id}/run")
def run_workflow(workflow_id: str):
    item = database.get_workflow(workflow_id)
    if not item:
        raise HTTPException(404, "Workflow not found")
    if item["status"] != "awaiting_approval":
        raise HTTPException(409, "Workflow must be awaiting approval")
    if not any(s.get("requires_approval") for s in item["steps"]):
        raise HTTPException(400, "Approval checkpoint missing")
    log = ["Approval received.", "Workflow structure validated.",
           "Actions simulated.", "Demo completed; no external systems were contacted."]
    now = datetime.now(timezone.utc).isoformat()
    database.update_status(workflow_id, "completed_demo")
    database.save_run(workflow_id, "completed_demo", log, now)
    return {"workflow_id": workflow_id, "status": "completed_demo",
            "message": "Demo completed. No external systems were contacted.", "log": log}

@app.get("/api/runs")
def runs():
    return database.list_runs()
