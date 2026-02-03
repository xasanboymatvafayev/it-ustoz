
import os
import json
import logging
import psycopg2
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

# --- LOGGING SETUP ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI-USTOZ-BACKEND")

# --- APP INITIALIZATION ---
app = FastAPI(
    title="AI USTOZ SOVEREIGN API",
    description="Sovereign Learning Ecosystem Backend for Railway.app Deployment",
    version="3.0.0"
)

# --- CORS CONFIGURATION ---
# Railway-da frontend va backend URL manzillari turlicha bo'ladi
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.netlify.app",
    "https://ai-ustoz.netlify.app", # Sizning Netlify manzilingiz
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE ENGINE ---
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    """Railway-dagi PostgreSQL bazasiga ulanish."""
    try:
        if DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            return conn
        else:
            logger.warning("DATABASE_URL not detected. Railway provisioning might be incomplete.")
            return None
    except Exception as e:
        logger.error(f"Database Connection Error: {e}")
        return None

def init_db():
    """Barcha jadvallarni Railway-dagi PostgreSQL-da yaratish."""
    conn = get_db_connection()
    if not conn: return
    try:
        cur = conn.cursor()
        # Foydalanuvchilar
        cur.execute('''CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            firstname TEXT,
            lastname TEXT,
            email TEXT,
            role TEXT,
            enrolledcourses TEXT,
            avatar TEXT,
            parentphone TEXT
        )''')
        # Kurslar
        cur.execute('''CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            subject TEXT,
            teacher TEXT,
            secretkey TEXT,
            createdat BIGINT
        )''')
        # Vazifalar
        cur.execute('''CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            courseid TEXT,
            title TEXT,
            description TEXT,
            validationcriteria TEXT,
            order_index INTEGER DEFAULT 0,
            timerend BIGINT DEFAULT 0
        )''')
        # Chat xabarlari
        cur.execute('''CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            courseid TEXT,
            userid TEXT,
            username TEXT,
            useravatar TEXT,
            text TEXT,
            timestamp BIGINT
        )''')
        # Natijalar
        cur.execute('''CREATE TABLE IF NOT EXISTS task_results (
            id TEXT PRIMARY KEY,
            taskid TEXT,
            userid TEXT,
            username TEXT,
            studentanswer TEXT,
            aifeedback TEXT,
            aistatus TEXT,
            grade INTEGER,
            admingrade INTEGER,
            errors TEXT,
            solution TEXT,
            explanation TEXT,
            mistakepatterns TEXT,
            cognitiveimpact INTEGER,
            marketabilityboost INTEGER,
            status TEXT DEFAULT 'pending',
            timestamp BIGINT,
            courseid TEXT
        )''')
        # Kursga a'zo bo'lish so'rovlari
        cur.execute('''CREATE TABLE IF NOT EXISTS enrollment_requests (
            id TEXT PRIMARY KEY,
            userid TEXT,
            username TEXT,
            courseid TEXT,
            coursetitle TEXT,
            status TEXT DEFAULT 'pending'
        )''')
        conn.commit()
        cur.close()
        logger.info("Railway Sovereign Database Synced Successfully.")
    except Exception as e:
        logger.error(f"Database Initialization Failed: {e}")
    finally:
        conn.close()

# Startup-da bazani tayyorlash
init_db()

# --- API ROUTING ENGINE ---
api = APIRouter(prefix="/api")

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "engine": "Sovereign-v3",
        "platform": "Railway.app",
        "db_active": DATABASE_URL is not None
    }

# --- USER ENDPOINTS ---
@api.get("/users")
async def fetch_users():
    conn = get_db_connection()
    if not conn: return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users")
        rows = cur.fetchall()
        # JSON stringlarni listga o'girish
        for r in rows:
            r['enrolledCourses'] = json.loads(r['enrolledcourses'] or '[]')
        return rows
    finally:
        conn.close()

@api.post("/register_user")
async def register(user: dict = Body(...)):
    conn = get_db_connection()
    if not conn: raise HTTPException(500, "DB Unavailable")
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (id, username, password, firstname, lastname, email, role, enrolledcourses, avatar, parentphone) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING",
            (user['id'], user['username'], user.get('password', '1234'), user['firstName'], user['lastName'], user['email'], user['role'], json.dumps([]), user.get('avatar', ''), user.get('parentPhone', ''))
        )
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Register Error: {e}")
        raise HTTPException(400, str(e))
    finally:
        conn.close()

# --- COURSE ENDPOINTS ---
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
    if not conn: raise HTTPException(500)
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO courses (id, title, description, subject, teacher, secretkey, createdat) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (course['id'], course['title'], course['description'], course['subject'], course['teacher'], course['secretKey'], course['createdAt'])
        )
        conn.commit()
        return {"status": "created"}
    finally:
        conn.close()

# --- CHAT ENDPOINTS ---
@api.get("/messages/{course_id}")
async def fetch_messages(course_id: str):
    conn = get_db_connection()
    if not conn: return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM chat_messages WHERE courseid = %s ORDER BY timestamp ASC", (course_id,))
        return cur.fetchall()
    finally:
        conn.close()

@api.post("/messages")
async def post_message(msg: dict = Body(...)):
    conn = get_db_connection()
    if not conn: raise HTTPException(500)
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO chat_messages (id, courseid, userid, username, useravatar, text, timestamp) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (msg['id'], msg['courseId'], msg['userId'], msg['userName'], msg.get('userAvatar', ''), msg['text'], msg['timestamp'])
        )
        conn.commit()
        return {"status": "sent"}
    finally:
        conn.close()

# --- REQUESTS ENDPOINTS ---
@api.post("/requests/{req_id}/approve")
async def approve(req_id: str):
    conn = get_db_connection()
    if not conn: raise HTTPException(500)
    try:
        cur = conn.cursor()
        # 1. So'rovni topish
        cur.execute("SELECT * FROM enrollment_requests WHERE id = %s", (req_id,))
        req = cur.fetchone()
        if not req: raise HTTPException(404, "Request not found")
        
        # 2. Statusni yangilash
        cur.execute("UPDATE enrollment_requests SET status = 'approved' WHERE id = %s", (req_id,))
        
        # 3. Foydalanuvchini kursga qo'shish
        cur.execute("SELECT enrolledcourses FROM users WHERE id = %s", (req['userid'],))
        user_data = cur.fetchone()
        if user_data:
            courses = json.loads(user_data['enrolledcourses'] or '[]')
            if req['courseid'] not in courses:
                courses.append(req['courseid'])
                cur.execute("UPDATE users SET enrolledcourses = %s WHERE id = %s", (json.dumps(courses), req['userid']))
        
        conn.commit()
        return {"status": "approved"}
    finally:
        conn.close()

# Routerlarni ulash
app.include_router(api)

# --- RAILWAY DEPLOYMENT PORT BINDING ---
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting Railway Engine on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
