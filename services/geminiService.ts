
import { GoogleGenAI, Type } from "@google/genai";
import { SubjectType, TaskResult } from "../types.ts";

const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function checkTask(userName: string, subject: SubjectType, task: string, courseTitle: string): Promise<TaskResult> {
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

    const data = JSON.parse(response.text || "{}");
    
    return {
      ...data,
      userName,
      timestamp: Date.now(),
      id: Math.random().toString(),
      courseId: '',
      taskId: 'generic',
      userId: '',
      status: 'pending'
    };
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("AI bilan bog'lanishda xatolik yuz berdi.");
  }
}
