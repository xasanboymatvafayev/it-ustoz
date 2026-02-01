
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SubjectType, TaskResult, QuizQuestion } from "../types.ts";

export async function checkTask(userName: string, subject: SubjectType, task: string, courseTitle: string): Promise<TaskResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `Siz AI USTOZ - o'quvchilarga ta'lim beruvchi shaxsiy mentorsunuz. 
  Vazifa: O'quvchining javobini tahlil qiling. 
  Uslub: Rag'batlantiruvchi, lekin professional. 
  Baholash: 0 dan 100 gacha ball bering. 
  Xatolarni ko'rsating va ideal yechimni taqdim eting.`;

  const prompt = `O'quvchi: ${userName}
  Fan: ${subject}
  Mavzu: ${courseTitle}
  O'quvchi javobi: ${task}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            result: { type: Type.STRING, description: "Umumiy xulosa" },
            errors: { type: Type.STRING, description: "Xatolar tahlili" },
            solution: { type: Type.STRING, description: "Ideal yechim" },
            explanation: { type: Type.STRING, description: "Nega bunday yechilgani" },
            grade: { type: Type.NUMBER, description: "0-100 ball" },
            mistakePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            cognitiveImpact: { type: Type.NUMBER },
            marketabilityBoost: { type: Type.NUMBER }
          },
          required: ["result", "errors", "solution", "explanation", "grade"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');

    // TTS orqali mentorning qisqa ovozli xabarini yaratish
    let audioData = "";
    try {
      const audioRes = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Salom ${userName}. Sening javobingni tekshirdim. Sen ${data.grade} ball olding. ${data.result.substring(0, 100)}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      audioData = audioRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (e) {}

    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      userId: "",
      userName,
      timestamp: Date.now(),
      courseId: "",
      taskId: "mvp_demo",
      status: "pending",
      audioData
    };
  } catch (err) {
    console.error(err);
    throw new Error("AI Mentor hozir band, iltimos keyinroq urinib ko'ring.");
  }
}

// Added generateQuiz to provide quiz functionality using Gemini
export async function generateQuiz(subject: string, level: string): Promise<QuizQuestion[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 5 multiple-choice questions about ${subject} for ${level} level in Uzbek language.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER, description: "Correct answer index (0-3)" },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error("Quiz generation failed:", err);
    return [];
  }
}
