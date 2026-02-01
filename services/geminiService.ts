
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SubjectType, TaskResult, QuizQuestion } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateQuiz(subject: string, level: string): Promise<QuizQuestion[]> {
  const prompt = `Generate 5 high-quality multiple choice questions for ${subject} at ${level} level. 
  Return ONLY a JSON array of objects with keys: question, options (array of 4 strings), correctAnswer (index 0-3), and explanation.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
              correctAnswer: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Quiz generation failed:", error);
    return [];
  }
}

export async function checkTask(userName: string, subject: SubjectType, task: string, courseTitle: string): Promise<TaskResult> {
  const systemInstruction = `Siz $10M lik EdTech platformasining Lead AI Mentor-isiz. O'quvchining mantiqiy xatolarini va bozor qiymatini tahlil qiling.`;

  const prompt = `O'quvchi: ${userName}\nSoha: ${subject}\nKod/Vazifa: ${task}\nJSON formatda javob bering.`;

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
            result: { type: Type.STRING },
            errors: { type: Type.STRING },
            solution: { type: Type.STRING },
            explanation: { type: Type.STRING },
            grade: { type: Type.NUMBER },
            mistakePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            cognitiveImpact: { type: Type.NUMBER },
            marketabilityBoost: { type: Type.NUMBER }
          },
          required: ["result", "errors", "solution", "explanation", "grade", "mistakePatterns", "cognitiveImpact", "marketabilityBoost"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');

    let audioBase64 = "";
    try {
      const audioResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Salom ${userName}, kodingni tahlil qildim. ${data.result.substring(0, 100)}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      audioBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (e) {}

    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      userId: "",
      userName,
      timestamp: Date.now(),
      courseId: "",
      taskId: "sovereign",
      status: "pending",
      audioData: audioBase64
    };
  } catch (error: any) {
    throw new Error("AI Tahlili amalga oshmadi.");
  }
}
