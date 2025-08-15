import axios from "axios";

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export type GroqQuestion = {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  difficulty?: string;
  tags?: string[];
};

export async function generateQuestionsWithGroq(pdfText: string): Promise<GroqQuestion[]> {
  if (!GROQ_API_KEY) {
    console.error("GROQ API key is missing.");
    return [];
  }
  let allQuestions: GroqQuestion[] = [];
  let remaining = 400;
  let chunkSize = 100;
  while (remaining > 0) {
    const thisChunk = Math.min(chunkSize, remaining);
    const chunkPrompt = `Generate ${thisChunk} exam questions (MCQ or True/False) from the following text. Return JSON array with fields: type, question, options, answer, difficulty, tags.\nText:\n${pdfText}`;
    try {
      const response = await axios.post(GROQ_API_URL, {
        model: "llama3-70b-8192",
        messages: [
          { role: "user", content: chunkPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      }, {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      });
      let content = response.data.choices[0].message.content;
      // Extract JSON array from markdown/code block or extra text
      let jsonMatch = content.match(/```json([\s\S]*?)```/i) || content.match(/```([\s\S]*?)```/i);
      if (jsonMatch) {
        content = jsonMatch[1];
      } else {
        // Try to find the first [ ... ] array in the text
        const arrMatch = content.match(/\[([\s\S]*?)\]/);
        if (arrMatch) {
          content = '[' + arrMatch[1] + ']';
        }
      }
      let questions: GroqQuestion[] = [];
      try {
        questions = JSON.parse(content);
      } catch (jsonErr) {
        console.error("GROQ did not return valid JSON:", response.data.choices[0].message.content);
        break;
      }
      allQuestions = allQuestions.concat(questions);
    } catch (err) {
      console.error("Failed to parse GROQ response or API error", err);
      break;
    }
    remaining -= thisChunk;
  }
  return allQuestions;
}
