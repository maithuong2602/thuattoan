
import { GoogleGenAI } from "@google/genai";

// Strictly follow the guideline to use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAlgorithmExplanation = async (
  algorithm: string,
  stepDescription: string,
  state: any
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are a friendly computer science teacher for middle school students.
        Explain this step of the ${algorithm} algorithm in a fun, simple way.
        Current step: "${stepDescription}".
        Context: ${JSON.stringify(state)}.
        Keep the explanation very short (max 2 sentences) and encouraging.
        Output in Vietnamese if possible, otherwise English.
      `,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });

    // Directly access response.text property as per guidelines
    return response.text || "Đang phân tích bước này...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hãy quan sát sự thay đổi của các con số nhé!";
  }
};
