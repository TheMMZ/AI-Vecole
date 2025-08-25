export type GroqResult = {
  raw: string;
  questions: GroqQuestion[];
};
import axios from "axios";

const GROQ_API_URL =
  process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export type GroqQuestion = {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  difficulty?: string;
  tags?: string[];
};

export async function generateQuestionsWithGroq(pdfText: string): Promise<GroqResult> {
  if (!GROQ_API_KEY) {
    console.error("GROQ API key is missing.");
    return { raw: "", questions: [] };
  }
  let allQuestions: GroqQuestion[] = [];
  let remaining = 50;
  let chunkSize = 20;
  let rawAccum = "";

  while (remaining > 0) {
    const thisChunk = Math.min(chunkSize, remaining);
    const chunkPrompt = `Generate ${thisChunk} exam questions (MCQ or True/False) from the following text. 
      Return ONLY a valid JSON array. Do not include any text before or after the JSON. Do not add explanations, comments, or extra words. Each object must have:
      - "type": "MCQ" or "TrueFalse"
      - "question": string
      - "options": array of strings (for TrueFalse, always ["True", "False"])
      - "answer": string (must be one of the options)
      - "difficulty": "easy" | "medium" | "hard"
      - "tags": array of strings

      Do not include explanations or text outside the JSON.

      Text:
      ${pdfText}`;
    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: chunkPrompt }],
          temperature: 0.7,
          max_tokens: 4096,
        },
        {
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 20000
        }
      );
      let content = response.data.choices[0].message.content;
      rawAccum += content + "\n";
      // --- Robust JSON extraction logic ---
      let extracted = "";
      const firstBracket = content.indexOf("[");
      const lastBracket = content.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        extracted = content.substring(firstBracket, lastBracket + 1);
        console.log("Extracted JSON array from first '[' to last ']'");
      } else {
        // fallback: try to extract from code block or use full content
        let jsonMatch = content.match(/```json([\s\S]*?)```/i) || content.match(/```([\s\S]*?)```/i);
        if (jsonMatch) {
          extracted = jsonMatch[1];
          console.log("Extracted JSON from code block");
        } else {
          extracted = content;
          console.log("No brackets found, using full content");
        }
      }
      let questions: GroqQuestion[] = [];
      try {
        questions = JSON.parse(extracted);
      } catch (jsonErr) {
        console.error("GROQ did not return valid JSON. Extraction attempt:", extracted);
        // Optionally, save the extracted string for debugging
        rawAccum += `\n[[EXTRACTED_JSON_ATTEMPT]]\n${extracted}\n`;
        break;
      }
      allQuestions = allQuestions.concat(questions);
    } catch (err: any) {
      // Ensure we capture the error info into the raw accumulation so callers can persist it
      try {
        const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        rawAccum += `[[GROQ_ERROR]] ${errMsg}\n`;
        if (err.code) rawAccum += `code=${err.code}\n`;
        if (err.response && err.response.data) rawAccum += `response=${JSON.stringify(err.response.data)}\n`;
      } catch (e) {
        // ignore any error while building error string
      }
      console.error("Failed to call GROQ API:", err);
      break;
    }
    remaining -= thisChunk;
  }
  return { raw: rawAccum.trim(), questions: allQuestions };
}
