
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os
import logging

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI USTOZ API")

# CORS Settings for Vercel/Localhost
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    try:
        if DATABASE_URL:
            return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        else:
            # Fallback to local development if needed
            return None
    except Exception as e:
        logger.error(f"DB Connection Error: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if not conn: return
    try:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, password TEXT, firstname TEXT, lastname TEXT, email TEXT, role TEXT, enrolledcourses TEXT, avatar TEXT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT, description TEXT, subject TEXT, teacher TEXT, createdat BIGINT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, courseid TEXT, title TEXT, description TEXT, order_index INTEGER, isclasstask INTEGER DEFAULT 0, timerend BIGINT DEFAULT 0)''')
        c.execute('''CREATE TABLE IF NOT EXISTS task_results (id TEXT PRIMARY KEY, taskid TEXT, userid TEXT, username TEXT, result TEXT, errors TEXT, solution TEXT, explanation TEXT, grade INTEGER, admingrade INTEGER, status TEXT, timestamp BIGINT, courseid TEXT)''')
        conn.commit()
        c.close()
        logger.info("Tables initialized")
    finally:
        conn.close()

init_db()

@app.get("/")
async def root():
    return {"status": "AI USTOZ Backend Live", "demo_ready": True}

# --- USER ENDPOINTS ---
@app.get("/api/users")
async def get_users():
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM users")
    rows = c.fetchall()
    conn.close()
    return rows

@app.post("/api/register_user")
async def register(u: dict):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    c = conn.cursor()
    c.execute("INSERT INTO users (id, username, password, firstname, lastname, email, role, enrolledcourses) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
              (u['id'], u['username'], u['password'], u['firstName'], u['lastName'], u['email'], u['role'], json.dumps([])))
    conn.commit()
    conn.close()
    return {"status": "ok"}

# --- TASK & RESULT ENDPOINTS ---
@app.get("/api/tasks")
async def get_tasks():
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM tasks ORDER BY order_index ASC")
    rows = c.fetchall()
    conn.close()
    return rows

@app.post("/api/results")
async def save_result(res: dict):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    c = conn.cursor()
    c.execute("INSERT INTO task_results (id, taskid, userid, username, result, errors, solution, explanation, grade, status, timestamp, courseid) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
              (res['id'], res['taskId'], res['userId'], res['userName'], res['result'], res['errors'], res['solution'], res['explanation'], res['grade'], 'pending', res['timestamp'], res['courseId']))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/api/results")
async def get_results():
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM task_results ORDER BY timestamp DESC")
    rows = c.fetchall()
    conn.close()
    return rows
