import fs from "fs";
import pdfParse from "pdf-parse";

/**
 * Extracts text from a PDF file at the given path.
 * @param filePath Absolute path to the PDF file
 * @returns Promise<string> Extracted text
 */
export async function extractPdfText(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    console.error('PDF extraction error:', err);
    return '';
  }
}
