
import React from 'react';

const PitchDoc: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 pb-24">
      <section className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-6">🚀 Pitch (30 & 60 Soniyalik)</h2>
        <div className="space-y-6">
          <div className="bg-white/10 p-4 rounded-xl border border-white/20">
            <h3 className="font-bold text-lg mb-2 text-indigo-200">30 Soniyalik Pitch:</h3>
            <p className="italic">
              "Assalomu alaykum! Maktab o‘quvchilari uchun uyga vazifa tekshirish katta stress, o‘qituvchilar uchun esa vaqt talabi. 
              Biz **AI Ustoz**ni yaratdik. Bu — o‘quvchilar topshirig‘ini real vaqtda tekshiradigan, xatolarini muloyimlik bilan tushuntiradigan 
              va repetitorga ehtiyojni kamaytiradigan sun'iy intellektli platforma. Jamiyatga real foyda, maktablarga yordamchi!"
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/20">
            <h3 className="font-bold text-lg mb-2 text-indigo-200">60 Soniyalik Pitch:</h3>
            <p className="italic">
              "Bilamizki, ota-onalar farzandi darsini tekshira olmasligi mumkin, repetitorlar esa hamma uchun emas. 
              **AI Ustoz** — bu har bir o‘quvchining shaxsiy aqlli yordamchisi. Bizning MVP orqali Matematika, Ingliz tili va Ona tili 
              bo‘yicha vazifalar darhol tahlil qilinadi. U shunchaki javob bermaydi, xatoni qayerda qilinganini tushuntiradi. 
              Maqsadimiz — ta'limni hamyonbop va qulay qilish. Kelajakda rasmlarni tanish va ovozli aloqa bilan ta'lim ekotizimini yaratamiz!"
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-server text-indigo-600"></i> Backend & API Strukturasi
        </h2>
        <div className="prose prose-indigo max-w-none">
          <p className="text-gray-600">FastAPI (Python) asosida qurilgan backend quyidagi endpointlarga ega bo'ladi:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><code>POST /check-task</code>: Topshiriqni yuborish va AI tahlilini olish.</li>
            <li><code>GET /stats</code>: Umumiy statistika (faqat admin uchun).</li>
            {/* Fix: Escaped curly braces to avoid JSX interpreting it as a variable reference */}
            <li><code>GET /history/{"{username}"}</code>: Foydalanuvchi darslar tarixi.</li>
          </ul>
          <h4 className="mt-6 font-bold">FastAPI Implementatsiyasi (Python):</h4>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto">
{`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai # Yoki Google Generative AI

app = FastAPI()

class TaskRequest(BaseModel):
    user_name: str
    subject: str
    task_text: str

@app.post("/check-task")
async def check_task(req: TaskRequest):
    # AI logic here
    response = call_ai_api(req.task_text, req.subject)
    # Save to SQLite
    return response

@app.get("/stats")
async def get_stats():
    # DB query logic
    return {"total_checks": 150}`}
          </pre>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-question-circle text-orange-500"></i> Hakamlar Savollari & Javoblar
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-bold text-gray-900 mb-1">Savol: AI xato qilishi mumkin-ku?</div>
            <div className="text-gray-600 text-sm italic">Javob: Bizning AI eng oxirgi model (Gemini 3) bo'lib, xatolik ehtimoli kam. Shunday bo'lsa ham, biz platformada 'O'qituvchi bilan tasdiqlash' tugmasini qo'shishni rejalashtirganmiz.</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-bold text-gray-900 mb-1">Savol: Monetizatsiya qanday?</div>
            <div className="text-gray-600 text-sm italic">Javob: Freemium model: kuniga 3 ta vazifa tekin, cheksiz foydalanish uchun oylik obuna yoki maktablar uchun korporativ litsenziya.</div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
        <h2 className="text-2xl font-bold mb-4">📍 Roadmap</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
          <div className="flex-1">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
            <div className="font-bold">MVP</div>
            <div className="text-xs text-gray-500">Hozirgi holat (Matnli tahlil)</div>
          </div>
          <div className="w-8 h-px bg-gray-200 hidden md:block"></div>
          <div className="flex-1 opacity-50">
            <div className="w-12 h-12 bg-gray-300 text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
            <div className="font-bold">OCR</div>
            <div className="text-xs text-gray-500">Rasmni matnga o'girish (Daftar rasmi)</div>
          </div>
          <div className="w-8 h-px bg-gray-200 hidden md:block"></div>
          <div className="flex-1 opacity-50">
            <div className="w-12 h-12 bg-gray-300 text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
            <div className="font-bold">Bozor</div>
            <div className="text-xs text-gray-500">Mobil ilova va maktablar integratsiyasi</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PitchDoc;
