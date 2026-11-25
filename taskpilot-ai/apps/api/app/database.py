import sqlite3, json, os
from pathlib import Path

DB_PATH = Path(os.getenv("TASKPILOT_DB", "taskpilot.db"))

def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with connect() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS workflows (
            id TEXT PRIMARY KEY, prompt TEXT NOT NULL, title TEXT NOT NULL,
            status TEXT NOT NULL, steps_json TEXT NOT NULL, created_at TEXT NOT NULL
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, workflow_id TEXT NOT NULL,
            status TEXT NOT NULL, log_json TEXT NOT NULL, created_at TEXT NOT NULL
        )""")

def save_workflow(w):
    with connect() as conn:
        conn.execute("INSERT INTO workflows VALUES (?, ?, ?, ?, ?, ?)",
            (w["id"], w["prompt"], w["title"], w["status"], json.dumps(w["steps"]), w["created_at"]))

def get_workflow(workflow_id):
    with connect() as conn:
        row = conn.execute("SELECT * FROM workflows WHERE id=?", (workflow_id,)).fetchone()
    if not row: return None
    item = dict(row)
    item["steps"] = json.loads(item.pop("steps_json"))
    return item

def list_workflows():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM workflows ORDER BY created_at DESC LIMIT 50").fetchall()
    result = []
    for row in rows:
        item = dict(row)
        item["steps"] = json.loads(item.pop("steps_json"))
        result.append(item)
    return result

def update_status(workflow_id, status):
    with connect() as conn:
        conn.execute("UPDATE workflows SET status=? WHERE id=?", (status, workflow_id))

def save_run(workflow_id, status, log, created_at):
    with connect() as conn:
        conn.execute("INSERT INTO runs (workflow_id,status,log_json,created_at) VALUES (?,?,?,?)",
                     (workflow_id, status, json.dumps(log), created_at))

def list_runs():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM runs ORDER BY created_at DESC LIMIT 50").fetchall()
    return [{"id":r["id"], "workflow_id":r["workflow_id"], "status":r["status"],
             "log":json.loads(r["log_json"]), "created_at":r["created_at"]} for r in rows]
