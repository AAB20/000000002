import { GoogleGenAI, Type } from "@google/genai";
import { Subject, AIInsight } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateAcademicInsight = async (subjects: Subject[]): Promise<AIInsight> => {
  if (!apiKey) {
    return {
      analysis: "API Key not configured. Please check your environment settings.",
      tips: ["Configure API Key to see insights."],
      sentiment: "neutral"
    };
  }

  // Filter out subjects with no scores to save tokens and reduce noise
  const activeSubjects = subjects.filter(s => s.scores.length > 0).map(s => ({
    name: s.name,
    scores: s.scores.map(sc => ({
      title: sc.title,
      score: sc.value,
      max: sc.max,
      date: sc.date
    }))
  }));

  if (activeSubjects.length === 0) {
    return {
      analysis: "No data available yet. Add some subjects and scores to get started!",
      tips: ["Add a subject like 'Mathematics' or 'History'.", "Log your latest quiz results."],
      sentiment: "neutral"
    };
  }

  const prompt = `
    Analyze the following academic performance data for a student. 
    Data: ${JSON.stringify(activeSubjects)}
    
    Provide a response in JSON format with the following structure:
    {
      "analysis": "A concise paragraph summarizing overall performance, trends (improving/declining), and standout subjects.",
      "tips": ["Tip 1", "Tip 2", "Tip 3"],
      "sentiment": "positive" | "neutral" | "negative" | "encouraging"
    }

    The tips should be specific actionable study advice based on the weak areas identified. 
    If performance is high, suggest enrichment or maintenance strategies.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            sentiment: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIInsight;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      analysis: "Sorry, I couldn't analyze your data at the moment. Please try again later.",
      tips: ["Check your internet connection.", "Ensure your API key is valid."],
      sentiment: "neutral"
    };
  }
};