from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "academy.db"

def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id TEXT PRIMARY KEY, username TEXT, password TEXT, firstName TEXT, lastName TEXT, 
                  email TEXT, role TEXT, enrolledCourses TEXT, grade TEXT, avatar TEXT, parentPhone TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS courses 
                 (id TEXT PRIMARY KEY, title TEXT, description TEXT, subject TEXT, teacher TEXT, createdAt INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS tasks 
                 (id TEXT PRIMARY KEY, courseId TEXT, title TEXT, description TEXT, order_index INTEGER, 
                  isClassTask INTEGER DEFAULT 0, timerEnd INTEGER DEFAULT 0)''')
    c.execute('''CREATE TABLE IF NOT EXISTS task_results 
                 (id TEXT PRIMARY KEY, taskId TEXT, userId TEXT, userName TEXT, result TEXT, 
                  errors TEXT, solution TEXT, explanation TEXT, grade INTEGER, adminGrade INTEGER, 
                  status TEXT, timestamp INTEGER, courseId TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS enrollment_requests 
                 (id TEXT PRIMARY KEY, userId TEXT, userName TEXT, courseId TEXT, courseTitle TEXT, status TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS chat_messages
                 (id TEXT PRIMARY KEY, courseId TEXT, userId TEXT, userName TEXT, userAvatar TEXT, text TEXT, timestamp INTEGER)''')
    conn.commit()
    conn.close()

init_db()

@app.get("/")
async def root():
    return {"status": "AI Academy API is running", "environment": "Railway"}

@app.get("/api/users")
async def get_users():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    users = conn.execute("SELECT * FROM users").fetchall()
    res = []
    for u in users:
        d = dict(u)
        d['enrolledCourses'] = json.loads(d['enrolledCourses']) if d['enrolledCourses'] else []
        res.append(d)
    conn.close()
    return res

@app.put("/api/users/{id}")
async def update_user(id: str, u: dict):
    conn = sqlite3.connect(DATABASE)
    conn.execute("UPDATE users SET firstName=?, lastName=?, email=?, avatar=?, parentPhone=? WHERE id=?",
                 (u['firstName'], u['lastName'], u['email'], u.get('avatar'), u.get('parentPhone'), id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.post("/api/register_user")
async def register_user(u: dict):
    conn = sqlite3.connect(DATABASE)
    try:
        conn.execute("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                     (u['id'], u['username'], u['password'], u['firstName'], u['lastName'], 
                      u['email'], u['role'], json.dumps([]), u['grade'], u.get('avatar'), u.get('parentPhone')))
        conn.commit()
    except Exception as e:
        print(f"Error registering user: {e}")
    finally:
        conn.close()
    return {"status": "ok"}

@app.get("/api/courses")
async def get_courses():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    courses = conn.execute("SELECT * FROM courses").fetchall()
    conn.close()
    return [dict(c) for c in courses]

@app.post("/api/courses")
async def add_course(course: dict):
    conn = sqlite3.connect(DATABASE)
    conn.execute("INSERT INTO courses VALUES (?,?,?,?,?,?)", 
                 (course['id'], course['title'], course['description'], course['subject'], course['teacher'], course['createdAt']))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/api/tasks")
async def get_tasks():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    tasks = conn.execute("SELECT * FROM tasks").fetchall()
    conn.close()
    return [dict(t) for t in tasks]

@app.post("/api/tasks")
async def add_task(task: dict):
    conn = sqlite3.connect(DATABASE)
    conn.execute("INSERT INTO tasks VALUES (?,?,?,?,?,?,?)", 
                 (task['id'], task['courseId'], task['title'], task['description'], task.get('order', 0), 
                  1 if task.get('isClassTask') else 0, task.get('timerEnd', 0)))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.patch("/api/tasks/{id}/timer")
async def update_task_timer(id: str, data: dict):
    conn = sqlite3.connect(DATABASE)
    conn.execute("UPDATE tasks SET timerEnd = ? WHERE id = ?", (data['timerEnd'], id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/api/results")
async def get_results():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    results = conn.execute("SELECT * FROM task_results").fetchall()
    conn.close()
    return [dict(r) for r in results]

@app.post("/api/results")
async def add_result(res: dict):
    conn = sqlite3.connect(DATABASE)
    conn.execute("INSERT INTO task_results VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", 
                 (res['id'], res['taskId'], res['userId'], res['userName'], res['result'], 
                  res['errors'], res['solution'], res['explanation'], res['grade'], 
                  res.get('adminGrade'), res['status'], res['timestamp'], res['courseId']))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.patch("/api/results/{id}")
async def update_result(id: str, data: dict):
    conn = sqlite3.connect(DATABASE)
    conn.execute("UPDATE task_results SET adminGrade = ?, status = ? WHERE id = ?", 
                 (data['adminGrade'], data['status'], id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/api/requests")
async def get_requests():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    requests = conn.execute("SELECT * FROM enrollment_requests").fetchall()
    conn.close()
    return [dict(r) for r in requests]

@app.post("/api/requests")
async def add_request(req: dict):
    conn = sqlite3.connect(DATABASE)
    conn.execute("INSERT INTO enrollment_requests VALUES (?,?,?,?,?,?)", 
                 (req['id'], req['userId'], req['userName'], req['courseId'], req['courseTitle'], req['status']))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.post("/api/requests/{id}/approve")
async def approve_request(id: str):
    conn = sqlite3.connect(DATABASE)
    req = conn.execute("SELECT * FROM enrollment_requests WHERE id = ?", (id,)).fetchone()
    if req:
        user_id, course_id = req[1], req[3]
        user = conn.execute("SELECT enrolledCourses FROM users WHERE id = ?", (user_id,)).fetchone()
        if user:
            courses = json.loads(user[0]) if user[0] else []
            if course_id not in courses:
                courses.append(course_id)
                conn.execute("UPDATE users SET enrolledCourses = ? WHERE id = ?", (json.dumps(courses), user_id))
        conn.execute("DELETE FROM enrollment_requests WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.delete("/api/users/{u_id}/courses/{c_id}")
async def remove_user_course(u_id: str, c_id: str):
    conn = sqlite3.connect(DATABASE)
    user = conn.execute("SELECT enrolledCourses FROM users WHERE id = ?", (u_id,)).fetchone()
    if user:
        courses = json.loads(user[0]) if user[0] else []
        courses = [c for c in courses if c != c_id]
        conn.execute("UPDATE users SET enrolledCourses = ? WHERE id = ?", (json.dumps(courses), u_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/api/chat/{course_id}")
async def get_chat(course_id: str):
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    msgs = conn.execute("SELECT * FROM chat_messages WHERE courseId = ? ORDER BY timestamp ASC", (course_id,)).fetchall()
    conn.close()
    return [dict(m) for m in msgs]

@app.post("/api/chat")
async def add_chat(msg: dict):
    conn = sqlite3.connect(DATABASE)
    conn.execute("INSERT INTO chat_messages VALUES (?,?,?,?,?,?,?)",
                 (msg['id'], msg['courseId'], msg['userId'], msg['userName'], msg.get('userAvatar'), msg['text'], msg['timestamp']))
    conn.commit()
    conn.close()
    return {"status": "ok"}
