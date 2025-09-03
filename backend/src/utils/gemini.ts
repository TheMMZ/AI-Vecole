import axios from "axios";

export type GeminiResult = {
  raw: string;
  questions: GeminiQuestion[];
};

export type GeminiQuestion = {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  difficulty?: string;
  tags?: string[];
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function generateQuestionsWithGemini(pdfText: string): Promise<GeminiResult> {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key is missing.");
    return { raw: "", questions: [] };
  }
  let allQuestions: GeminiQuestion[] = [];
  let rawAccum = "";
  const prompt = `Generate exam questions (MCQ or True/False) from the following text: ${pdfText}.
Return ONLY a valid JSON array of at least 1 question object. Do not return empty arrays. Do not include any text before or after the JSON. Do not add explanations, comments, or extra words. Each object must have:
- \"type\": \"MCQ\" or \"TrueFalse\"
- \"question\": string
- \"options\": array of strings (for TrueFalse, always [\"True\", \"False\"])
- \"answer\": string (must be one of the options)
- \"difficulty\": \"easy\" | \"medium\" | \"hard\"
- \"tags\": array of strings
If you cannot generate any questions, return an array with a single object: {"type": "error", "question": "No questions could be generated.", "options": [], "answer": "", "difficulty": "", "tags": []}
Do not include explanations or text outside the JSON.`;
  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY
        },
        timeout: 20000
      }
    );
    let content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    rawAccum += content + "\n";
    // --- Robust JSON extraction logic ---
    let extracted = "";
    const firstBracket = content.indexOf("[");
    const lastBracket = content.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      extracted = content.substring(firstBracket, lastBracket + 1);
    } else {
      let jsonMatch = content.match(/```json([\s\S]*?)```/i) || content.match(/```([\s\S]*?)```/i);
      if (jsonMatch) {
        extracted = jsonMatch[1];
      } else {
        extracted = content;
      }
    }
    let questions: GeminiQuestion[] = [];
    try {
      questions = JSON.parse(extracted);
    } catch (jsonErr) {
      rawAccum += `\n[[EXTRACTED_JSON_ATTEMPT]]\n${extracted}\n`;
    }
    allQuestions = allQuestions.concat(questions);
  } catch (err: any) {
    try {
      const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      rawAccum += `[[GEMINI_ERROR]] ${errMsg}\n`;
      if (err.code) rawAccum += `code=${err.code}\n`;
      if (err.response && err.response.data) rawAccum += `response=${JSON.stringify(err.response.data)}\n`;
    } catch (e) {}
  }
  return { raw: rawAccum.trim(), questions: allQuestions };
}
