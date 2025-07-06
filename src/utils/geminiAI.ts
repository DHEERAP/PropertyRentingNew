import { GoogleGenerativeAI } from "@google/generative-ai";

export async function evaluatePropertyWithGemini(prompt: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating text", error);
    throw new Error("Error generating property evaluation");
  }
} 