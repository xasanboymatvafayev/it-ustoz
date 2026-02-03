
import os
import json
import logging
import psycopg2
import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body, Request, APIRouter, Response
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

# --- LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI-USTOZ-BACKEND")

app = FastAPI(title="AI Ustoz Railway API", version="5.1.0")

# --- CORS SOZLAMALARI ---
# Eng ochiq va ruxsat beruvchi CORS rejimi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def get_db_connection(retries=3):
    last_err = None
    for i in range(retries):
        try:
            if DATABASE_URL:
                conn = psycopg2.connect(
                    DATABASE_URL, 
                    cursor_factory=RealDictCursor, 
                    connect_timeout=10, 
                    sslmode='require'
                )
                return conn
            return None
        except Exception as e:
            last_err = e
            logger.warning(f"DB ulanish urinishi {i+1} muvaffaqiyatsiz: {e}")
            time.sleep(1)
    logger.error(f"DB ga ulanib bo'lmadi: {last_err}")
    return None

async def init_db():
    conn = get_db_connection()
    if not conn: 
        logger.warning("Ma'lumotlar bazasiz rejim.")
        return
    try:
        cur = conn.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, firstname TEXT, lastname TEXT, email TEXT, role TEXT, enrolledcourses TEXT, avatar TEXT, parentphone TEXT)")
        cur.execute("CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT, description TEXT, subject TEXT, teacher TEXT, secretkey TEXT, createdat BIGINT)")
        cur.execute("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, courseid TEXT, title TEXT, description TEXT, validationcriteria TEXT, order_index INTEGER DEFAULT 0, timerend BIGINT DEFAULT 0)")
        cur.execute("CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, courseid TEXT, userid TEXT, username TEXT, useravatar TEXT, text TEXT, timestamp BIGINT)")
        cur.execute("CREATE TABLE IF NOT EXISTS task_results (id TEXT PRIMARY KEY, taskid TEXT, userid TEXT, username TEXT, studentanswer TEXT, aifeedback TEXT, aistatus TEXT, grade INTEGER, admingrade INTEGER, errors TEXT, solution TEXT, explanation TEXT, mistakepatterns TEXT, cognitiveimpact INTEGER, marketabilityboost INTEGER, status TEXT DEFAULT 'pending', timestamp BIGINT, courseid TEXT)")
        cur.execute("CREATE TABLE IF NOT EXISTS enrollment_requests (id TEXT PRIMARY KEY, userid TEXT, username TEXT, courseid TEXT, coursetitle TEXT, status TEXT DEFAULT 'pending')")
        conn.commit()
        logger.info("Railway Postgres DB tayyor.")
    except Exception as e:
        logger.error(f"Init DB Error: {e}")
    finally:
        conn.close()

@app.on_event("startup")
async def startup_event():
    import asyncio
    asyncio.create_task(init_db())

api = APIRouter(prefix="/api")

@app.get("/")
async def root_health():
    return {"status": "ok", "service": "AI Ustoz Backend", "env": "Production"}

@api.get("/users")
async def fetch_users():
    conn = get_db_connection()
    if not conn: return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users")
        rows = cur.fetchall()
        for r in rows:
            r['enrolledCourses'] = json.loads(r['enrolledcourses'] or '[]')
            r['firstName'] = r.pop('firstname', '')
            r['lastName'] = r.pop('lastname', '')
        return rows
    finally:
        conn.close()

@api.post("/register_user")
async def register(user: dict = Body(...)):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO users (id, username, password, firstname, lastname, email, role, enrolledcourses, avatar, parentphone) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username", 
                    (user['id'], user['username'], user.get('password','1234'), user.get('firstName',''), user.get('lastName',''), user['email'], user['role'], json.dumps([]), user.get('avatar',''), user.get('parentPhone','')))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

@api.get("/courses")
async def fetch_courses():
    conn = get_db_connection()
    if not conn: return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM courses ORDER BY createdat DESC")
        return cur.fetchall()
    finally:
        conn.close()

@api.post("/courses")
async def add_course(course: dict = Body(...)):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO courses (id, title, description, subject, teacher, secretkey, createdat) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (course['id'], course['title'], course['description'], course['subject'], course['teacher'], course['secretKey'], course['createdAt']))
        conn.commit()
        return {"status": "created"}
    finally:
        conn.close()

@api.get("/tasks")
async def fetch_tasks():
    conn = get_db_connection()
    if not conn: return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM tasks")
        rows = cur.fetchall()
        for r in rows:
            r['courseId'] = r.pop('courseid', '')
            r['validationCriteria'] = r.pop('validationcriteria', '')
            r['timerEnd'] = r.pop('timerend', 0)
        return rows
    finally:
        conn.close()

@api.post("/tasks")
async def add_task(task: dict = Body(...)):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO tasks (id, courseid, title, description, validationcriteria, timerend) VALUES (%s,%s,%s,%s,%s,%s)",
                    (task['id'], task['courseId'], task['title'], task['description'], task['validationCriteria'], task.get('timerEnd', 0)))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

@api.get("/results")
async def fetch_results():
    conn = get_db_connection()
    if not conn: return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM task_results ORDER BY timestamp DESC")
        rows = cur.fetchall()
        for r in rows:
            r['taskId'] = r.pop('taskid', '')
            r['userId'] = r.pop('userid', '')
            r['userName'] = r.pop('username', '')
            r['studentAnswer'] = r.pop('studentanswer', '')
            r['aiFeedback'] = r.pop('aifeedback', '')
            r['aiStatus'] = r.pop('aistatus', 'fail')
            r['adminGrade'] = r.pop('admingrade', None)
            r['mistakePatterns'] = json.loads(r.pop('mistakepatterns', '[]') or '[]')
            r['cognitiveImpact'] = r.pop('cognitiveimpact', 0)
            r['marketabilityBoost'] = r.pop('marketabilityboost', 0)
            r['courseId'] = r.pop('courseid', '')
        return rows
    finally:
        conn.close()

@api.post("/results")
async def save_result(res: dict = Body(...)):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO task_results (id, taskid, userid, username, studentanswer, aifeedback, aistatus, grade, admingrade, errors, solution, explanation, mistakepatterns, cognitiveimpact, marketabilityboost, status, timestamp, courseid) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (res['id'], res['taskId'], res['userId'], res['userName'], res['studentAnswer'], res['aiFeedback'], res['aiStatus'], res['grade'], res.get('adminGrade'), res['errors'], res['solution'], res['explanation'], json.dumps(res['mistakePatterns']), res['cognitiveImpact'], res['marketabilityBoost'], res.get('status','pending'), res['timestamp'], res['courseId']))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

@api.patch("/results/{id}")
async def update_result(id: str, updates: dict = Body(...)):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        cur = conn.cursor()
        if 'adminGrade' in updates:
            cur.execute("UPDATE task_results SET admingrade = %s, status = %s WHERE id = %s", 
                        (updates['adminGrade'], updates.get('status', 'reviewed'), id))
        conn.commit()
        return {"status": "updated"}
    finally:
        conn.close()

@api.get("/requests")
async def fetch_requests():
    conn = get_db_connection()
    if not conn: return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM enrollment_requests")
        rows = cur.fetchall()
        for r in rows:
            r['userId'] = r.pop('userid', '')
            r['userName'] = r.pop('username', '')
            r['courseId'] = r.pop('courseid', '')
            r['courseTitle'] = r.pop('coursetitle', '')
        return rows
    finally:
        conn.close()

@api.post("/requests")
async def save_request(req: dict = Body(...)):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO enrollment_requests (id, userid, username, courseid, coursetitle, status) VALUES (%s,%s,%s,%s,%s,%s)",
                    (req['id'], req['userId'], req['userName'], req['courseId'], req['courseTitle'], req['status']))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

@api.post("/requests/{id}/approve")
async def approve_request(id: str):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM enrollment_requests WHERE id = %s", (id,))
        req = cur.fetchone()
        if not req: return {"status": "not_found"}
        
        cur.execute("SELECT enrolledcourses FROM users WHERE id = %s", (req['userid'],))
        user_row = cur.fetchone()
        courses = json.loads(user_row['enrolledcourses'] or '[]')
        if req['courseid'] not in courses:
            courses.append(req['courseid'])
            cur.execute("UPDATE users SET enrolledcourses = %s WHERE id = %s", (json.dumps(courses), req['userid']))
        
        cur.execute("UPDATE enrollment_requests SET status = 'approved' WHERE id = %s", (id,))
        conn.commit()
        return {"status": "approved"}
    finally:
        conn.close()

@api.get("/messages/{cId}")
async def get_messages(cId: str):
    conn = get_db_connection()
    if not conn: return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM chat_messages WHERE courseid = %s ORDER BY timestamp ASC", (cId,))
        rows = cur.fetchall()
        for r in rows:
            r['courseId'] = r.pop('courseid', '')
            r['userId'] = r.pop('userid', '')
            r['userName'] = r.pop('username', '')
            r['userAvatar'] = r.pop('useravatar', '')
        return rows
    finally:
        conn.close()

@api.post("/messages")
async def send_message(msg: dict = Body(...)):
    conn = get_db_connection()
    if not conn: return {"status": "error"}
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO chat_messages (id, courseid, userid, username, useravatar, text, timestamp) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (msg['id'], msg['courseId'], msg['userId'], msg['userName'], msg.get('userAvatar',''), msg['text'], msg['timestamp']))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

app.include_router(api)
