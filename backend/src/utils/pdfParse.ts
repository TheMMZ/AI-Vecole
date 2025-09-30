import fs from "fs";
// Use require to avoid TypeScript declaration issues when running with ts-node locally
const pdfParse: any = require("pdf-parse");

/**
 * Extracts text from a PDF file path or a Buffer.
 * @param input Absolute path to the PDF file or a Buffer containing PDF data
 * @returns Promise<string> Extracted text
 */
export async function extractPdfText(input: string | Buffer): Promise<string> {
  try {
    let dataBuffer: Buffer;
    if (Buffer.isBuffer(input)) {
      dataBuffer = input as Buffer;
    } else {
      dataBuffer = fs.readFileSync(input as string);
    }
    const data = await pdfParse(dataBuffer);
    return data?.text || "";
  } catch (err) {
    console.error('PDF extraction error:', err);
    return '';
  }
}
