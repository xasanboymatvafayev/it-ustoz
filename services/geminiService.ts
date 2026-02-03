import { GoogleGenAI, Type } from "@google/genai";

const TUTOR_SYSTEM_INSTRUCTION = `
  Siz AI Ustoz platformasining guruh darslaridagi aqlli yordamchisisiz. 
  Sizning vazifangiz talabalarga guruh chatida yordam berish, savollarga javob berish va muhokamani qo'llab-quvvatlash.
  Siz doimo o'zbek tilida, muloyim va professional ohangda gapirasiz.
  Talabalarni rag'batlantiring va ularga yo'nalish bering.
  Agar talaba biror texnik savol bersa, tushunarli va misollar bilan tushuntiring.
`;

export async function checkTask(
  userName: string, 
  subject: string, 
  studentAnswer: string, 
  courseTitle: string,
  criteria?: string
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Vazifa: ${courseTitle} (${subject})
    O'quvchi: ${userName}
    Admin tomonidan qo'yilgan talab (Logic): ${criteria || 'Mantiqiy to\'g\'rilik'}
    O'quvchining javobi: ${studentAnswer}

    Siz o'qituvchi yordamchisisiz. O'quvchining javobini admin kriteriyasiga mosligini tekshiring.
    Tushuntirishni o'zbek tilida yozing.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: { type: Type.NUMBER, description: "0-100 gacha ball" },
            result: { type: Type.STRING, description: "Qisqa xulosa" },
            errors: { type: Type.STRING, description: "Xatolar tahlili" },
            mistakePatterns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Xato turlari" },
            cognitiveImpact: { type: Type.NUMBER, description: "1-10 gacha o'sish" },
            marketabilityBoost: { type: Type.NUMBER, description: "Reyting o'sishi %" },
            solution: { type: Type.STRING, description: "Ideal yechim kodi/matni" },
            explanation: { type: Type.STRING, description: "Arxitektura tahlili" },
            aiStatus: { type: Type.STRING, description: "'pass' yoki 'fail'" },
            aiFeedback: { type: Type.STRING, description: "Xatolar tahlili va tushuntirish" }
          },
          required: ["grade", "result", "errors", "mistakePatterns", "cognitiveImpact", "marketabilityBoost", "solution", "explanation", "aiStatus", "aiFeedback"]
        }
      }
    });

    // Qoidaga ko'ra response.text() emas, response.text ishlatiladi
    const textOutput = response.text;
    return JSON.parse(textOutput || '{}');
  } catch (err) {
    console.error("Gemini CheckTask Error:", err);
    return { 
      grade: 0, 
      result: "Xatolik", 
      errors: "AI tahlilida muammo yuz berdi.", 
      mistakePatterns: [], 
      cognitiveImpact: 0, 
      marketabilityBoost: 0, 
      solution: "", 
      explanation: "", 
      aiStatus: 'fail', 
      aiFeedback: "AI ulanishda xatolik yuz berdi." 
    };
  }
}

export async function getTutorResponse(courseTitle: string, userMessage: string, history: { role: 'user' | 'model', text: string }[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: `Kurs: ${courseTitle}. Xabar: ${userMessage}` }] }
      ],
      config: {
        systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.8,
      }
    });
    return response.text; // Property ishlatildi
  } catch (error) {
    console.error("AI Tutor Error:", error);
    return "Kechirasiz, hozirgi vaqtda javob bera olmayman.";
  }
}

export async function generateQuiz(subject: string, level: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `${subject} fanidan ${level} darajadagi 5 ta test savolini generatsiya qiling.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER, description: "0-3 oralig'ida to'g'ri indeks" },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]'); // Property ishlatildi
  } catch (err) {
    console.error("Quiz Generator Error:", err);
    return [];
  }
}