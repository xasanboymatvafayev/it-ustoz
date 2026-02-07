
import os
import asyncio
import logging
import random
import string
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from google import genai
from google.genai import types as genai_types

# --- KONFIGURATSIYA ---
TOKEN = os.environ.get("BOT_TOKEN") # BotFather'dan olingan token
GEMINI_KEY = os.environ.get("API_KEY") # Google AI Studio API Key
DATABASE_URL = os.environ.get("DATABASE_URL")
WEBAPP_URL = "https://ai-ustoz.vercel.app" # Sizning Web App manzilingiz

# Railway uchun URLni to'g'irlash
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

logging.basicConfig(level=logging.INFO)
bot = Bot(token=TOKEN)
dp = Dispatcher()
ai = genai.Client(api_key=GEMINI_KEY)

# --- DATABASE LOGIC ---
def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor, sslmode='require')

class TaskStates(StatesGroup):
    waiting_for_task = State()

# --- HELPER FUNCTIONS ---
def generate_pass():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=8))

async def analyze_task(text: str, photo_data=None):
    """Gemini orqali vazifani tahlil qilish"""
    model_id = "gemini-2.0-flash-exp"
    prompt = f"""
    Siz AI Ustoz platformasining o'qituvchi yordamchisisiz. 
    Quyidagi vazifani tekshiring va xatolarni o'zbek tilida tushuntiring.
    
    Vazifa/Javob: {text}
    
    Javobni quyidagi formatda bering:
    1. Ball (0-100)
    2. Xatolar tahlili
    3. To'g'ri variant
    4. Tavsiya
    """
    
    if photo_data:
        response = await ai.models.generate_content(
            model=model_id,
            contents=[
                genai_types.Part.from_bytes(data=photo_data, mime_type="image/jpeg"),
                prompt
            ]
        )
    else:
        response = await ai.models.generate_content(model=model_id, contents=prompt)
    
    return response.text

# --- KEYBOARDS ---
def main_kb():
    kb = [
        [KeyboardButton(text="📝 Vazifani tekshirish")],
        [KeyboardButton(text="🎓 Mening kurslarim", web_app=WebAppInfo(url=WEBAPP_URL))],
        [KeyboardButton(text="👤 Profil"), KeyboardButton(text="ℹ️ Yordam")]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)

# --- HANDLERS ---
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    tg_id = str(message.from_user.id)
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM users WHERE id = %s", (tg_id,))
    user = cur.fetchone()
    
    if not user:
        password = generate_pass()
        username = f"user_{tg_id}"
        cur.execute(
            "INSERT INTO users (id, username, password, firstname, lastname, email, role, enrolledcourses) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (tg_id, username, password, message.from_user.first_name, message.from_user.last_name or "", "", "user", json.dumps([]))
        )
        conn.commit()
        welcome = (
            f"🌟 <b>Xush kelibsiz, {message.from_user.first_name}!</b>\n\n"
            f"Siz AI Ustoz tizimidan muvaffaqiyatli ro'yxatdan o'tdingiz.\n"
            f"🔑 <b>Login:</b> <code>{username}</code>\n"
            f"🔐 <b>Parol:</b> <code>{password}</code>\n\n"
            f"Web App'ga kirish uchun ushbu ma'lumotlardan foydalaning."
        )
    else:
        welcome = f"👋 Qaytganingizdan xursandmiz, {user['firstname']}!"
    
    conn.close()
    await message.answer(welcome, parse_mode="HTML", reply_markup=main_kb())

@dp.message(F.text == "📝 Vazifani tekshirish")
async def ask_task(message: types.Message, state: FSMContext):
    await message.answer("Iltimos, vazifangizni matn ko'rinishida yozing yoki rasmini yuboring 📸")
    await state.set_state(TaskStates.waiting_for_task)

@dp.message(TaskStates.waiting_for_task)
async def process_task(message: types.Message, state: FSMContext):
    msg = await message.answer("⏳ AI Ustoz tahlil qilmoqda, kuting...")
    
    try:
        if message.photo:
            photo = message.photo[-1]
            file = await bot.get_file(photo.file_id)
            photo_bytes = await bot.download_file(file.file_path)
            analysis = await analyze_task(message.caption or "Rasm tahlili", photo_bytes.read())
        else:
            analysis = await analyze_task(message.text)
        
        await msg.edit_text(f"✅ <b>Tahlil yakunlandi:</b>\n\n{analysis}", parse_mode="HTML")
    except Exception as e:
        logging.error(f"AI Error: {e}")
        await msg.edit_text("❌ Kechirasiz, tahlil qilishda xatolik yuz berdi. Qayta urinib ko'ring.")
    
    await state.clear()

@dp.message(F.text == "👤 Profil")
async def show_profile(message: types.Message):
    tg_id = str(message.from_user.id)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (tg_id,))
    u = cur.fetchone()
    conn.close()
    
    if u:
        text = (
            f"👤 <b>PROFIL</b>\n\n"
            f"ID: <code>{u['id']}</code>\n"
            f"Login: <code>{u['username']}</code>\n"
            f"Rol: {u['role'].upper()}\n"
        )
        await message.answer(text, parse_mode="HTML")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
