/**
 * AI Summarization Layer - Summary Merger
 * 
 * Takes multiple chunk summaries and merges them into a single cohesive, structured
 * final report tailored to either Medical or Legal domains under 1000 system prompt chars.
 */

interface MergeSummariesOptions {
  docType: "medical" | "legal";
  language?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export async function mergeSummaries(
  chunkSummaries: string[],
  options: MergeSummariesOptions
): Promise<string> {
  const {
    docType,
    language = "English",
    maxRetries = 6,
    timeoutMs = 20000, // 20s timeout for the final merge
  } = options;

  if (chunkSummaries.length === 0) {
    return "No summaries available to merge.";
  }

  // If there's only one chunk, we can still run it through the merge layer
  // to ensure the final output is perfectly structured into the 5 mandatory sections.
  let combinedSummariesText = chunkSummaries
    .map((summary, index) => `[Summary from Chunk ${index + 1}]:\n${summary}`)
    .join("\n\n");

  // Hard Cap Limit: Max Merge Input = 12,000 characters to prevent TPM/rate limits on the 70B model
  if (combinedSummariesText.length > 12000) {
    console.log(`[Smart Merge Filter] Combined summaries text is ${combinedSummariesText.length} characters. Truncating to 12000 limit.`);
    combinedSummariesText = combinedSummariesText.substring(0, 12000) + "\n\n[Summaries truncated for length optimization]";
  }

  // Domain-specific high-fidelity prompts containing step 0 gate, companion personas, and zero-tolerance rules
  const systemPrompt = docType === "medical"
    ? `You are the advanced AI companion companion in Medical Mode: a Senior Medical Reviewer. Speak in the first person ("I") and address the user directly as "you" (your patient). Translate jargon into simple terms, putting jargon in single quotes followed by simple meaning, e.g. 'hyperglycemia' (high blood sugar). Respond in ${language}.

====================================
🚨 STEP 0: REALITY CHECK GATE
====================================
Scan summaries for fictional, placeholder, or fan-made elements: celebrity names (e.g., "Virat Kohli", "MS Dhoni"), emojis inside professional text or names, or fan slogans/jersey numbers.
👉 IF DETECTED: Output ONLY this exact notice and completely STOP:
"⚠️ NOTICE: This document appears to be a template, mock-up, or fan-made edit rather than a real official record."

====================================
🔴 STRICTOR RULES (INSIGHT EXTRACTION ONLY)
====================================
1. STRICT METADATA EXCLUSION: Never mention report names, lab/clinic/hospital names, certificate names, patient identity details (names, sex, age, addresses), barcodes, registration IDs, or administrative details.
2. NO GENERIC FRAMING: NEVER output generic filler introductions like "This report shows...", "This blood report indicates...", or "The medical certificate indicates...". Start directly with the insights.
3. CORE MEDICAL FOCUS: Focus ONLY on abnormal findings, major health conditions, critical test results, medications, precautions, doctor recommendations, health risks, and meaningful medical insights.
4. NO MATH CONTRADICTIONS: Numerical values inside reference ranges are strictly "Normal", not "high", "low", or "borderline".
5. Risks: Only list parameters strictly OUTSIDE reference ranges. If none, write "None".
6. Actions: Only list actions explicitly written. If none, write "No specific action items are outlined in this document."

====================================
OUTPUT FORMAT
====================================
### 1. Key Insights
[Focus ONLY on direct, meaningful health insights. NEVER mention report titles, lab names, or introductory filler.]

### 2. Important Risks
[Abnormal findings and health risks only. If none, write "None"]

### 3. Critical Findings
- [Short, sharp bullet points of core metrics/findings in simple layman terms. Start directly with the finding (e.g., "Vitamin D levels appear low.").]

### 4. Recommended Actions
[Direct actions from text or "No specific action items..."]

### 5. Simplified Explanation
[Very short, layman-friendly 2-3 sentence explanation summarizing actual health status. No introductions.]`
    : `You are the advanced AI companion companion in Legal Mode: a Senior Legal Analyst. Speak in the first person ("I") and address the user directly as "you" (your client). Translate jargon into simple terms, putting jargon in single quotes followed by simple meaning, e.g. 'indemnify' (protect from legal harm). Respond in ${language}.

====================================
🚨 STEP 0: REALITY CHECK GATE
====================================
Scan summaries for fictional, placeholder, or fan-made elements: celebrity names (e.g., "Virat Kohli", "MS Dhoni"), emojis inside professional text or names, or fan slogans/jersey numbers.
👉 IF DETECTED: Output ONLY this exact notice and completely STOP:
"⚠️ NOTICE: This document appears to be a template, mock-up, or fan-made edit rather than a real official record."

====================================
🔴 STRICTOR RULES (INSIGHT EXTRACTION ONLY)
====================================
1. STRICT METADATA EXCLUSION: Never mention agreement/contract titles repeatedly, page headings, company headers, personal/corporate names, registration numbers, addresses, or repetitive legal formatting.
2. NO GENERIC FRAMING: NEVER output generic filler introductions like "This agreement outlines...", "The purpose of this agreement...", or "Both parties agree...". Start directly with the insights.
3. CORE LEGAL FOCUS: Focus ONLY on payment obligations, penalties, late fees, automatic termination, liability transfer, confidentiality obligations, ownership restrictions, arbitration requirements, legal consequences, operational restrictions, and deadlines.
4. NO STANDARD CLAUSE ALARMS: Standard contract rules (e.g. 30-day termination, payment in 15 days) are standard, NOT legal risks. If none, Risks must strictly be "None".
5. Risks: Only list actual unusual liabilities or penalties. If none, write "None".
6. Actions: Only list actions explicitly written. If none, write "No specific action items are outlined in this document."

====================================
OUTPUT FORMAT
====================================
### 1. Key Insights
[Focus ONLY on direct, meaningful legal insights. NEVER mention document titles, contract overviews, or introductory filler.]

### 2. Important Risks
[Actual penalties/liabilities only. If none, write "None"]

### 3. Critical Findings
- [Short, sharp bullet points of core obligations/clauses, translating legalese to simple language. Start directly with the rule (e.g., "Late payment can terminate services.").]

### 4. Recommended Actions
[Direct actions from text or "No specific action items..."]

### 5. Simplified Explanation
[Very short, layman-friendly 2-3 sentence explanation of obligations. No introductions.]`;

  console.log(`Merge System Prompt Length: ${systemPrompt.length} chars`);

  const model = "llama-3.3-70b-versatile";
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
      console.log(`[Merge] Starting merge attempt ${attempt}/${maxRetries}...`);

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
            { role: "user", content: `Chunk summaries to merge:\n\n${combinedSummariesText}` }
          ],
          temperature: 0.2, // Low temperature for high consistency and structure
          max_tokens: 800,  // Compact, highly structured final output limit
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
      const finalSummary = data?.choices?.[0]?.message?.content;

      if (!finalSummary) {
        throw new Error("Empty response received from Groq API during merge.");
      }

      console.log("[Merge] Merged and formatted final summary successfully.");
      return finalSummary.trim();

    } catch (error: any) {
      clearTimeout(id);
      console.error(`[Merge] Attempt ${attempt} failed:`, error.message || error);

      if (error.name === "AbortError") {
        console.warn("[Merge] Request timed out.");
      }

      if (attempt >= maxRetries) {
        throw new Error(`Failed to merge summaries after ${maxRetries} attempts. Original error: ${error.message}`);
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
          console.log(`[Rate Limit] Merge parsed sleep of ${sec}s. Waiting ${waitMs}ms before retrying...`);
        } else if (msMatch) {
          const ms = parseFloat(msMatch[1]);
          waitMs = Math.ceil(ms) + 600; // exact ms + 600ms safety buffer
          console.log(`[Rate Limit] Merge parsed sleep of ${ms}ms. Waiting ${waitMs}ms before retrying...`);
        } else {
          waitMs = 5000; // Default fallback for rate limit
          console.log(`[Rate Limit] Merge generic rate limit. Waiting ${waitMs}ms before retrying...`);
        }
      } else {
        console.log(`[Network/Other] Merge transient error. Waiting default backoff ${waitMs}ms before retrying...`);
      }

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw new Error("Merge failed.");
}
