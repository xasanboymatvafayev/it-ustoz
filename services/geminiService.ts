
import { GoogleGenAI, Type } from "@google/genai";
import { SubjectType, TaskResult } from "../types.ts";

export async function checkTask(userName: string, subject: SubjectType, task: string, courseTitle: string): Promise<TaskResult> {
  // Brauzer muhitida API kalitini olishning eng xavfsiz usuli
  let apiKey = "";
  
  try {
    // Vercel build o'zgaruvchisi yoki global shim
    apiKey = (window as any).process?.env?.API_KEY || "";
  } catch (e) {
    console.error("API Key access error:", e);
  }

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Gemini API kaliti sozlanmagan. Iltimos, Vercel sozlamalarida API_KEY o'zgaruvchisini tekshiring.");
  }

  // SDK faqat funksiya chaqirilganda va kalit borligida ishga tushadi
  const ai = new GoogleGenAI({ apiKey });

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
      "result": "Tahlil xulosasi",
      "errors": "Koddagi xatolar",
      "solution": "Ideal kod namunasi",
      "explanation": "Maslahat",
      "grade": 85
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

    const textOutput = response.text;
    if (!textOutput) throw new Error("AI dan javob olinmadi");
    
    const data = JSON.parse(textOutput);
    
    return {
      ...data,
      userName,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
      courseId: '',
      taskId: 'generic',
      userId: '',
      status: 'pending'
    };
  } catch (error: any) {
    console.error("AI Error Details:", error);
    if (error.message?.includes('API key')) {
      throw new Error("API kaliti noto'g'ri yoki faol emas.");
    }
    throw new Error("AI tahlilida xatolik: " + (error.message || "Noma'lum xato"));
  }
}
