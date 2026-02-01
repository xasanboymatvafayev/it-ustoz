
from fastapi import FastAPI, HTTPException, Body, Request, APIRouter
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

# CORS Settings
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
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            return conn
        else:
            logger.warning("DATABASE_URL not found, using in-memory mock logic (not implemented)")
            return None
    except Exception as e:
        logger.error(f"DB Connection Error: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if not conn: return
    try:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, password TEXT, firstname TEXT, lastname TEXT, email TEXT, role TEXT, enrolledcourses TEXT, avatar TEXT, parentphone TEXT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT, description TEXT, subject TEXT, teacher TEXT, createdat BIGINT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, courseid TEXT, title TEXT, description TEXT, order_index INTEGER, isclasstask INTEGER DEFAULT 0, timerend BIGINT DEFAULT 0)''')
        c.execute('''CREATE TABLE IF NOT EXISTS task_results (id TEXT PRIMARY KEY, taskid TEXT, userid TEXT, username TEXT, result TEXT, errors TEXT, solution TEXT, explanation TEXT, grade INTEGER, admingrade INTEGER, status TEXT, timestamp BIGINT, courseid TEXT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS enrollment_requests (id TEXT PRIMARY KEY, userid TEXT, username TEXT, courseid TEXT, coursetitle TEXT, status TEXT)''')
        conn.commit()
        c.close()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Database Init Error: {e}")
    finally:
        conn.close()

# Initialize DB on startup
init_db()

# --- API ROUTER ---
api_router = APIRouter(prefix="/api")

@app.get("/")
async def root():
    return {"status": "AI USTOZ Backend Live", "demo_ready": True}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "db_connected": DATABASE_URL is not None}

# --- USER ENDPOINTS ---
@api_router.get("/users")
async def get_users():
    conn = get_db_connection()
    if not conn: return []
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM users")
        rows = c.fetchall()
        return rows
    finally:
        conn.close()

@api_router.post("/register_user")
async def register(u: dict):
    conn = get_db_connection()
    if not conn: return {"status": "error", "message": "No DB connection"}
    try:
        c = conn.cursor()
        c.execute("INSERT INTO users (id, username, password, firstname, lastname, email, role, enrolledcourses, parentphone) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                  (u['id'], u['username'], u['password'], u['firstName'], u['lastName'], u['email'], u['role'], json.dumps([]), u.get('parentPhone', '')))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

# --- COURSE ENDPOINTS ---
@api_router.get("/courses")
async def get_courses():
    conn = get_db_connection()
    if not conn: return []
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM courses")
        rows = c.fetchall()
        return rows
    finally:
        conn.close()

@api_router.post("/courses")
async def save_course(c_data: dict):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        c = conn.cursor()
        c.execute("INSERT INTO courses (id, title, description, subject, teacher, createdat) VALUES (%s,%s,%s,%s,%s,%s)",
                  (c_data['id'], c_data['title'], c_data['description'], c_data['subject'], c_data['teacher'], c_data['createdAt']))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

# --- TASK & RESULT ENDPOINTS ---
@api_router.get("/tasks")
async def get_tasks():
    conn = get_db_connection()
    if not conn: return []
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM tasks ORDER BY order_index ASC")
        rows = c.fetchall()
        return rows
    finally:
        conn.close()

@api_router.post("/tasks")
async def save_task(t: dict):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        c = conn.cursor()
        c.execute("INSERT INTO tasks (id, courseid, title, description, order_index) VALUES (%s,%s,%s,%s,%s)",
                  (t['id'], t['courseId'], t['title'], t['description'], t.get('order', 0)))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

@api_router.get("/results")
async def get_results():
    conn = get_db_connection()
    if not conn: return []
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM task_results ORDER BY timestamp DESC")
        rows = c.fetchall()
        return rows
    finally:
        conn.close()

@api_router.post("/results")
async def save_result(res: dict):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        c = conn.cursor()
        c.execute("INSERT INTO task_results (id, taskid, userid, username, result, errors, solution, explanation, grade, status, timestamp, courseid) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                  (res['id'], res['taskId'], res['userId'], res['userName'], res['result'], res['errors'], res['solution'], res['explanation'], res['grade'], 'pending', res['timestamp'], res['courseId']))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

# --- REQUEST ENDPOINTS ---
@api_router.get("/requests")
async def get_requests():
    conn = get_db_connection()
    if not conn: return []
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM enrollment_requests WHERE status = 'pending'")
        rows = c.fetchall()
        return rows
    finally:
        conn.close()

@api_router.post("/requests")
async def save_request(r: dict):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        c = conn.cursor()
        c.execute("INSERT INTO enrollment_requests (id, userid, username, courseid, coursetitle, status) VALUES (%s,%s,%s,%s,%s,%s)",
                  (r['id'], r['userId'], r['userName'], r['courseId'], r['courseTitle'], 'pending'))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

@api_router.post("/requests/{req_id}/approve")
async def approve_request(req_id: str):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM enrollment_requests WHERE id = %s", (req_id,))
        req = c.fetchone()
        if req:
            c.execute("UPDATE enrollment_requests SET status = 'approved' WHERE id = %s", (req_id,))
            c.execute("SELECT enrolledcourses FROM users WHERE id = %s", (req['userid'],))
            row = c.fetchone()
            if row:
                user_courses = json.loads(row['enrolledcourses'] or '[]')
                if req['courseid'] not in user_courses:
                    user_courses.append(req['courseid'])
                    c.execute("UPDATE users SET enrolledcourses = %s WHERE id = %s", (json.dumps(user_courses), req['userid']))
            conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

# Include the router in the app
app.include_router(api_router)
