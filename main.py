
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Render muhitidan DATABASE_URL ni olish
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    try:
        # PostgreSQL ulanishi uchun sslmode='require' Render-da kerak bo'lishi mumkin
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if not conn:
        print("Initial connection failed. Waiting for database...")
        return
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id TEXT PRIMARY KEY, username TEXT, password TEXT, firstName TEXT, lastName TEXT, 
                  email TEXT, role TEXT, enrolledCourses TEXT, grade TEXT, avatar TEXT, parentPhone TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS courses 
                 (id TEXT PRIMARY KEY, title TEXT, description TEXT, subject TEXT, teacher TEXT, createdAt BIGINT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS tasks 
                 (id TEXT PRIMARY KEY, courseId TEXT, title TEXT, description TEXT, order_index INTEGER, 
                  isClassTask INTEGER DEFAULT 0, timerEnd BIGINT DEFAULT 0)''')
    c.execute('''CREATE TABLE IF NOT EXISTS task_results 
                 (id TEXT PRIMARY KEY, taskId TEXT, userId TEXT, userName TEXT, result TEXT, 
                  errors TEXT, solution TEXT, explanation TEXT, grade INTEGER, adminGrade INTEGER, 
                  status TEXT, timestamp BIGINT, courseId TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS enrollment_requests 
                 (id TEXT PRIMARY KEY, userId TEXT, userName TEXT, courseId TEXT, courseTitle TEXT, status TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS chat_messages
                 (id TEXT PRIMARY KEY, courseId TEXT, userId TEXT, userName TEXT, userAvatar TEXT, text TEXT, timestamp BIGINT)''')
    conn.commit()
    c.close()
    conn.close()

init_db()

@app.get("/")
async def root():
    return {
        "status": "AI Academy API is running", 
        "environment": "Render + PostgreSQL",
        "live": True
    }

@app.get("/api/users")
async def get_users():
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM users")
    users = c.fetchall()
    res = []
    for u in users:
        d = dict(u)
        d['enrolledCourses'] = json.loads(d['enrolledcourses']) if d.get('enrolledcourses') else []
        res.append(d)
    c.close()
    conn.close()
    return res

@app.put("/api/users/{id}")
async def update_user(id: str, u: dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE users SET firstName=%s, lastName=%s, email=%s, avatar=%s, parentPhone=%s WHERE id=%s",
                 (u['firstName'], u['lastName'], u['email'], u.get('avatar'), u.get('parentPhone'), id))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.post("/api/register_user")
async def register_user(u: dict):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", 
                     (u['id'], u['username'], u['password'], u['firstName'], u['lastName'], 
                      u['email'], u['role'], json.dumps([]), u['grade'], u.get('avatar'), u.get('parentPhone')))
        conn.commit()
    except Exception as e:
        print(f"Error registering user: {e}")
    finally:
        c.close()
        conn.close()
    return {"status": "ok"}

@app.get("/api/courses")
async def get_courses():
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM courses")
    courses = c.fetchall()
    res = [dict(row) for row in courses]
    c.close()
    conn.close()
    return res

@app.post("/api/courses")
async def add_course(course: dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO courses VALUES (%s,%s,%s,%s,%s,%s)", 
                 (course['id'], course['title'], course['description'], course['subject'], course['teacher'], course['createdAt']))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.get("/api/tasks")
async def get_tasks():
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM tasks")
    tasks = c.fetchall()
    res = [dict(row) for row in tasks]
    c.close()
    conn.close()
    return res

@app.post("/api/tasks")
async def add_task(task: dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO tasks VALUES (%s,%s,%s,%s,%s,%s,%s)", 
                 (task['id'], task['courseId'], task['title'], task['description'], task.get('order', 0), 
                  1 if task.get('isClassTask') else 0, task.get('timerEnd', 0)))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.patch("/api/tasks/{id}/timer")
async def update_task_timer(id: str, data: dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE tasks SET timerEnd = %s WHERE id = %s", (data['timerEnd'], id))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.get("/api/results")
async def get_results():
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM task_results")
    results = c.fetchall()
    res = [dict(row) for row in results]
    c.close()
    conn.close()
    return res

@app.post("/api/results")
async def add_result(res: dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO task_results VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", 
                 (res['id'], res['taskId'], res['userId'], res['userName'], res['result'], 
                  res['errors'], res['solution'], res['explanation'], res['grade'], 
                  res.get('adminGrade'), res['status'], res['timestamp'], res['courseId']))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.patch("/api/results/{id}")
async def update_result(id: str, data: dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE task_results SET adminGrade = %s, status = %s WHERE id = %s", 
                 (data['adminGrade'], data['status'], id))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.get("/api/requests")
async def get_requests():
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM enrollment_requests")
    requests = c.fetchall()
    res = [dict(row) for row in requests]
    c.close()
    conn.close()
    return res

@app.post("/api/requests")
async def add_request(req: dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO enrollment_requests VALUES (%s,%s,%s,%s,%s,%s)", 
                 (req['id'], req['userId'], req['userName'], req['courseId'], req['courseTitle'], req['status']))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.post("/api/requests/{id}/approve")
async def approve_request(id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM enrollment_requests WHERE id = %s", (id,))
    req = c.fetchone()
    if req:
        user_id, course_id = req['userid'], req['courseid']
        c.execute("SELECT enrolledCourses FROM users WHERE id = %s", (user_id,))
        user_row = c.fetchone()
        if user_row:
            courses = json.loads(user_row['enrolledcourses']) if user_row['enrolledcourses'] else []
            if course_id not in courses:
                courses.append(course_id)
                c.execute("UPDATE users SET enrolledCourses = %s WHERE id = %s", (json.dumps(courses), user_id))
        c.execute("DELETE FROM enrollment_requests WHERE id = %s", (id,))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.delete("/api/users/{u_id}/courses/{c_id}")
async def remove_user_course(u_id: str, c_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT enrolledCourses FROM users WHERE id = %s", (u_id,))
    user_row = c.fetchone()
    if user_row:
        courses = json.loads(user_row['enrolledcourses']) if user_row['enrolledcourses'] else []
        courses = [c for c in courses if c != c_id]
        c.execute("UPDATE users SET enrolledCourses = %s WHERE id = %s", (json.dumps(courses), u_id))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}

@app.get("/api/chat/{course_id}")
async def get_chat(course_id: str):
    conn = get_db_connection()
    if not conn: return []
    c = conn.cursor()
    c.execute("SELECT * FROM chat_messages WHERE courseId = %s ORDER BY timestamp ASC", (course_id,))
    msgs = c.fetchall()
    res = [dict(row) for row in msgs]
    c.close()
    conn.close()
    return res

@app.post("/api/chat")
async def add_chat(msg: dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO chat_messages VALUES (%s,%s,%s,%s,%s,%s,%s)",
                 (msg['id'], msg['courseId'], msg['userId'], msg['userName'], msg.get('userAvatar'), msg['text'], msg['timestamp']))
    conn.commit()
    c.close()
    conn.close()
    return {"status": "ok"}
