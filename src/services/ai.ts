import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateLawyerResponse(
  prompt: string,
  systemInstruction: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  try {
    // Construct the full conversation history including the new prompt
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: `${systemInstruction}
      
      IMPORTANT GUARDRAILS:
      1. If the user asks about unrelated topics (e.g., dinner, sports, weather, coding), politely decline and steer the conversation back to sexual equality, gender-based violence, and legal perspectives.
      2. If the user uses aggressive, abusive, or offensive language, maintain a professional demeanor. Do not engage in a fight. Firmly but politely redirect to the legal discussion.
      3. ALWAYS respond in Traditional Chinese (繁體中文), regardless of the input language, unless explicitly asked to translate.
      4. Keep responses concise but insightful (around 100-200 words unless asked for more).
      5. Provide 3 relevant follow-up questions that the user might want to ask next, also in Traditional Chinese.
      `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: "The lawyer's response to the user's question in Traditional Chinese.",
            },
            suggested_questions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Three follow-up questions the user might want to ask next, in Traditional Chinese.",
            },
          },
          required: ["answer", "suggested_questions"],
        },
      },
      contents: contents,
    });

    const responseText = response.text;
    if (!responseText) {
      return { text: "抱歉，我無法產生回應。", suggestions: [] };
    }

    try {
      const json = JSON.parse(responseText);
      return { 
        text: json.answer, 
        suggestions: json.suggested_questions || [] 
      };
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      // Fallback: if JSON parsing fails, return the raw text (it might be the answer itself if the model ignored JSON instruction)
      return { text: responseText, suggestions: [] };
    }

  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}
