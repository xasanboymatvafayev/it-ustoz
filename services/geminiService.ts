
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, TaskResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function checkTask(userName: string, subject: Subject, task: string, courseTitle: string): Promise<TaskResult> {
  const prompt = `
    Foydalanuvchi: ${userName}
    Kurs nomi: ${courseTitle}
    IT Yo'nalishi: ${subject}
    Topshiriq/Kod: ${task}

    Sen tajribali Senior Software Engineer va IT mentorisan. 
    O'quvchining yozgan kodi yoki topshirig'ini texnik jihatdan mukammal tahlil qil.
    Clean Code, xavfsizlik va samaradorlikka e'tibor ber.
    
    Javobni quyidagi JSON formatda qaytar:
    {
      "result": "Tahlil xulosasi (masalan: Kod to'g'ri ishlamoqda, lekin optimizatsiya kerak)",
      "errors": "Koddagi xatolar yoki texnik kamchiliklar ro'yxati",
      "solution": "Ideal kod namunasi yoki to'g'ri texnik javob",
      "explanation": "Nega aynan shunday bo'lishi kerakligi haqida mentoralik maslahati",
      "grade": 0 dan 100 gacha ball
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            result: { type: Type.STRING },
            errors: { type: Type.STRING },
            solution: { type: Type.STRING },
            explanation: { type: Type.STRING },
            grade: { type: Type.NUMBER },
          },
          required: ["result", "errors", "solution", "explanation", "grade"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    return {
      ...data,
      subject,
      userName,
      timestamp: Date.now(),
      id: Math.random().toString(),
      courseId: '', // Bu keyinchalik to'ldiriladi
      taskId: 'generic',
      userId: '' // Bu keyinchalik to'ldiriladi
    };
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("AI bilan bog'lanishda xatolik yuz berdi.");
  }
}
