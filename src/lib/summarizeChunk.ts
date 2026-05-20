import { cleanText } from "./cleanText";

/**
 * AI Summarization Layer - Chunk Summarizer
 * 
 * Takes a text chunk and uses Groq API to extract structured insights into a valid JSON schema.
 */

interface SummarizeChunkOptions {
  docType: "medical" | "legal";
  language?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export async function summarizeChunk(
  chunk: string,
  chunkIndex: number,
  options: SummarizeChunkOptions
): Promise<string> {
  const {
    docType,
    language = "English",
    maxRetries = 6,
    timeoutMs = 15000, // 15s timeout per chunk
  } = options;

  // Choose appropriate highly structured system prompt for JSON generation
  const systemPrompt = `You are a structured information extraction engine in a Hybrid Document Intelligence System.
Analyze the provided document chunk and extract information into a strictly valid JSON object matching this schema:
{
  "type": "${docType}",
  "key_insights": ["Insight 1", ...],
  "risks": ["Risk 1", ...],
  "abnormal_findings": ["Abnormal finding 1", ...],
  "obligations": ["Obligation 1", ...],
  "financial_terms": ["Financial term 1", ...],
  "deadlines": ["Deadline 1", ...],
  "notes": ["Note 1", ...]
}

CRITICAL RULES:
1. Return ONLY the raw JSON object. DO NOT output markdown blocks, introductions, explanations, or formatting like \`\`\`json.
2. If in medical mode: Extract abnormal findings, test results, major conditions, medications, precautions, and doctor recommendations. Ignore lab names, report titles, barcodes, patient names, and administrative details.
3. If in legal mode: Extract obligations, penalties, late fees, automatic termination rules, liabilities, ownership restrictions, and due dates. Ignore contract names, company headers, and legal boilerplate.
4. Keep insights sharp, concise, and direct. Do not write generic framing filler like "this document shows" or "both parties agree".
5. NEVER invent facts or make assumptions. If a field has no corresponding data in the chunk, leave its array empty.`;

  console.log(`System Prompt Length: ${systemPrompt.length} chars`);

  const model = "llama-3.1-8b-instant";
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
  const apiKey = process.env.LLAMA_API_KEY;

  if (!apiKey) {
    throw new Error("LLAMA_API_KEY environment variable is not set.");
  }

  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[Chunk ${chunkIndex}] Summarization attempt ${attempt}/${maxRetries}...`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Chunk ${chunkIndex + 1} text to analyze:\n\n${chunk}` }
          ],
          temperature: 0.2, // Low temperature for high consistency and low hallucinations
          max_tokens: 500,  // Clean, structured chunk summaries
        }),
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`Groq API Error: ${errorMessage}`);
      }

      const data = await response.json();
      const summary = data?.choices?.[0]?.message?.content;

      if (!summary) {
        throw new Error("Empty response received from Groq API.");
      }

      console.log(`[Chunk ${chunkIndex}] Summarized successfully.`);
      return summary.trim();

    } catch (error: any) {
      clearTimeout(id);
      console.error(`[Chunk ${chunkIndex}] Attempt ${attempt} failed:`, error.message || error);

      // If it was aborted due to timeout
      if (error.name === "AbortError") {
        console.warn(`[Chunk ${chunkIndex}] Request timed out after ${timeoutMs}ms.`);
      }

      // If we've exhausted our retries, throw the error
      if (attempt >= maxRetries) {
        throw new Error(`Failed to summarize chunk ${chunkIndex + 1} after ${maxRetries} attempts. Original error: ${error.message}`);
      }

      // Smart Retry Delay Parser for Rate Limits (TPM / RPM)
      let waitMs = Math.pow(2, attempt) * 1000; // Exponential backoff default: 2s, 4s, 8s...
      const errText = error.message || "";
      
      if (errText.includes("Rate limit reached") || errText.includes("limit") || errText.includes("429")) {
        const secMatch = errText.match(/try again in (\d+(\.\d+)?)s/i);
        const msMatch = errText.match(/try again in (\d+(\.\d+)?)ms/i);
        
        if (secMatch) {
          const sec = parseFloat(secMatch[1]);
          waitMs = Math.ceil(sec * 1000) + 1200; // exact ms + 1.2s safety buffer
          console.log(`[Rate Limit] Chunk ${chunkIndex} parsed sleep of ${sec}s. Waiting ${waitMs}ms before retrying...`);
        } else if (msMatch) {
          const ms = parseFloat(msMatch[1]);
          waitMs = Math.ceil(ms) + 600; // exact ms + 600ms safety buffer
          console.log(`[Rate Limit] Chunk ${chunkIndex} parsed sleep of ${ms}ms. Waiting ${waitMs}ms before retrying...`);
        } else {
          waitMs = 5000; // Default fallback for rate limit
          console.log(`[Rate Limit] Chunk ${chunkIndex} generic rate limit. Waiting ${waitMs}ms before retrying...`);
        }
      } else {
        console.log(`[Network/Other] Chunk ${chunkIndex} transient error. Waiting default backoff ${waitMs}ms before retrying...`);
      }

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw new Error("Summarization failed.");
}
