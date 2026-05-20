import { createWorker } from "tesseract.js";

/**
 * OCR / PDF Extraction Layer
 * 
 * Handles extraction of plain text from PDFs and images on the backend.
 * Ensures we NEVER send raw PDFs or full base64 images directly to the LLM.
 */

interface Base64ParseResult {
  mimeType: string;
  buffer: Buffer;
}

function parseBase64(dataUrl: string): Base64ParseResult {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (!matches) {
    throw new Error("Invalid base64 data format");
  }
  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");
  return { mimeType, buffer };
}

export async function extractText(input: string | string[]): Promise<string> {
  if (!input) return "";

  // Handle array of base64 page images recursively
  if (Array.isArray(input)) {
    console.log(`[OCR] Processing ${input.length} page images sequentially...`);
    let combinedText = "";
    for (let i = 0; i < input.length; i++) {
      console.log(`[OCR] Extracting text from page ${i + 1}/${input.length}...`);
      const pageText = await extractText(input[i]);
      combinedText += `\n\n--- Page ${i + 1} ---\n${pageText}`;
    }
    return combinedText;
  }

  // Check if input is a base64 Data URL
  if (input.startsWith("data:")) {
    const { mimeType, buffer } = parseBase64(input);

    if (mimeType.startsWith("image/")) {
      console.log(`[OCR] Detected image mimeType: ${mimeType}. Running Tesseract OCR...`);
      let worker;
      try {
        worker = await createWorker("eng");
        const { data: { text } } = await worker.recognize(buffer);
        await worker.terminate();
        
        if (!text.trim()) {
          throw new Error("OCR extracted no text from the image. Please make sure the image is clear and contains text.");
        }
        return text;
      } catch (err: any) {
        console.error("Tesseract OCR Error:", err);
        if (worker) {
          try {
            await worker.terminate();
          } catch {}
        }
        throw new Error(`Failed to perform OCR on image: ${err.message}`);
      }
    }

    if (mimeType === "application/pdf") {
      console.log("[PDF Parse] Detected PDF mimeType. Running pdf-parse...");
      try {
        // Dynamically require pdf-parse to avoid compilation issues in some build environments
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        const text = data.text;
        
        if (!text || !text.trim()) {
          throw new Error("PDF seems to contain scanned images rather than selectable text. Please convert it to an image and upload as an image instead.");
        }
        return text;
      } catch (err: any) {
        console.error("PDF Parse Error:", err);
        throw new Error(`Failed to parse PDF: ${err.message}`);
      }
    }

    throw new Error(`Unsupported base64 MIME type: ${mimeType}`);
  }

  // If it's not base64, treat it as direct plain text (e.g. pasted text or client-side extracted text)
  return input;
}
