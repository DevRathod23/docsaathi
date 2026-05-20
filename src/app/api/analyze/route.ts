import { NextResponse } from "next/server";
import { extractText } from "../../../lib/extractText";
import { cleanText } from "../../../lib/cleanText";
import { detectDocType } from "../../../lib/detectDocType";
import { chunkText } from "../../../lib/chunkText";
import { summarizeChunk } from "../../../lib/summarizeChunk";
import { mergeSummaries } from "../../../lib/mergeSummaries";

// Global timeout for the entire API route: 75 seconds (well within robust deployment environments)
const GLOBAL_TIMEOUT_MS = 75000;

export async function POST(req: Request) {
  const globalStart = Date.now();
  console.log("[Pipeline] Starting multi-stage analysis pipeline...");

  try {
    // 1. Request Size & JSON Parse Safety
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid Content-Type. Expected application/json." },
        { status: 400 }
      );
    }

    const bodyText = await req.text();
    // Safety check: Limit request body size to 12MB to prevent memory exhaustion and DoS
    if (bodyText.length > 12 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload too large. Limit is 12MB." },
        { status: 413 }
      );
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json(
        { error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    const { text, language = "English" } = payload;

    if (!text) {
      return NextResponse.json(
        { error: "No text, image, or PDF data provided." },
        { status: 400 }
      );
    }

    // Set up global timeout abort controller
    const globalController = new AbortController();
    const timeoutId = setTimeout(() => {
      globalController.abort();
    }, GLOBAL_TIMEOUT_MS);

    try {
      // 2. Upload / Extraction Layer
      console.log("[Layer 1 & 2] Extracting text from input...");
      const rawExtractedText = await extractText(text);
      
      if (!rawExtractedText || !rawExtractedText.trim()) {
        return NextResponse.json(
          { error: "No text content could be extracted from the document." },
          { status: 400 }
        );
      }
      console.log(`[Layer 1 & 2] Extracted ${rawExtractedText.length} characters.`);

      // 3. Text Cleaning Layer
      console.log("[Layer 3] Cleaning extracted text...");
      const cleanedText = cleanText(rawExtractedText);
      console.log(`[Layer 3] Text cleaned. Character count optimized from ${rawExtractedText.length} to ${cleanedText.length}.`);

      if (!cleanedText) {
        return NextResponse.json(
          { error: "Document text is blank after cleaning noise." },
          { status: 400 }
        );
      }

      // 4. Document Type Detection Layer (Keyword-based, NO LLM)
      console.log("[Layer 4] Detecting document type...");
      const docType = detectDocType(cleanedText);
      console.log(`[Layer 4] Detected Document Type: ${docType.toUpperCase()}`);

      // 5. Chunking Layer
      console.log("[Layer 5] Chunking text...");
      // Chunk size of 3500 characters keeps it safely under the 4000 characters limit
      const chunks = chunkText(cleanedText, 3500);
      console.log(`[Layer 5] Text split into ${chunks.length} chunk(s).`);

      if (chunks.length === 0) {
        return NextResponse.json(
          { error: "Failed to partition text into valid chunks." },
          { status: 500 }
        );
      }

      // 6. AI Summarization Layer (Process chunks sequentially and parse JSON arrays)
      console.log("[Layer 6] Extracting structured chunk insights sequentially...");
      
      const masterData: {
        type: string;
        key_insights: string[];
        risks: string[];
        abnormal_findings: string[];
        obligations: string[];
        financial_terms: string[];
        deadlines: string[];
        notes: string[];
      } = {
        type: docType,
        key_insights: [],
        risks: [],
        abnormal_findings: [],
        obligations: [],
        financial_terms: [],
        deadlines: [],
        notes: []
      };

      for (let i = 0; i < chunks.length; i++) {
        // Check if global execution has timed out
        if (globalController.signal.aborted) {
          throw new Error("Pipeline execution exceeded the global time limit.");
        }

        console.log(`[Layer 6] Extracting insights from chunk ${i + 1}/${chunks.length} using 8B model...`);
        const chunkSummaryRaw = await summarizeChunk(chunks[i], i, {
          docType,
          language,
          maxRetries: 6,
          timeoutMs: 15000, // 15s limit per chunk
        });

        // Strip potential markdown JSON wrapper fences safely
        let cleanedJsonStr = chunkSummaryRaw.trim();
        cleanedJsonStr = cleanedJsonStr.replace(/^```json\s*/i, "");
        cleanedJsonStr = cleanedJsonStr.replace(/^```\s*/i, "");
        cleanedJsonStr = cleanedJsonStr.replace(/\s*```$/, "");
        cleanedJsonStr = cleanedJsonStr.trim();

        let parsedChunk;
        try {
          parsedChunk = JSON.parse(cleanedJsonStr);
        } catch (err: any) {
          console.warn(`[Pipeline] Chunk ${i + 1} did not return valid JSON. Error: ${err.message}. Raw: ${chunkSummaryRaw}`);
          // Graceful fallback: wrap raw summary in key_insights
          parsedChunk = {
            key_insights: [chunkSummaryRaw]
          };
        }

        // Aggregate lists safely checking if arrays exist
        if (Array.isArray(parsedChunk.key_insights)) masterData.key_insights.push(...parsedChunk.key_insights);
        if (Array.isArray(parsedChunk.risks)) masterData.risks.push(...parsedChunk.risks);
        if (Array.isArray(parsedChunk.abnormal_findings)) masterData.abnormal_findings.push(...parsedChunk.abnormal_findings);
        if (Array.isArray(parsedChunk.obligations)) masterData.obligations.push(...parsedChunk.obligations);
        if (Array.isArray(parsedChunk.financial_terms)) masterData.financial_terms.push(...parsedChunk.financial_terms);
        if (Array.isArray(parsedChunk.deadlines)) masterData.deadlines.push(...parsedChunk.deadlines);
        if (Array.isArray(parsedChunk.notes)) masterData.notes.push(...parsedChunk.notes);
      }

      // Deduplicate arrays programmatically (zero-token, instant!)
      const uniqueTrimmed = (arr: string[]) => {
        return Array.from(new Set(arr.map(s => s.trim()))).filter(Boolean);
      };

      masterData.key_insights = uniqueTrimmed(masterData.key_insights);
      masterData.risks = uniqueTrimmed(masterData.risks);
      masterData.abnormal_findings = uniqueTrimmed(masterData.abnormal_findings);
      masterData.obligations = uniqueTrimmed(masterData.obligations);
      masterData.financial_terms = uniqueTrimmed(masterData.financial_terms);
      masterData.deadlines = uniqueTrimmed(masterData.deadlines);
      masterData.notes = uniqueTrimmed(masterData.notes);

      console.log("[Layer 6] Structured insight aggregation completed successfully.");

      // 7. Summary Merge Layer
      console.log("[Layer 7] Rendering consolidated structured insights using 70B...");
      if (globalController.signal.aborted) {
        throw new Error("Pipeline execution exceeded the global time limit.");
      }

      const finalSummary = await mergeSummaries([JSON.stringify(masterData, null, 2)], {
        docType,
        language,
        maxRetries: 6,
        timeoutMs: 20000, // 20s limit for merge
      });

      clearTimeout(timeoutId);

      const durationSec = ((Date.now() - globalStart) / 1000).toFixed(2);
      console.log(`[Pipeline] Completed successfully in ${durationSec}s!`);

      // 8. Final Structured Output Layer
      return NextResponse.json({
        result: finalSummary,
        docType,
        stats: {
          chunksCount: chunks.length,
          originalLength: Array.isArray(text) ? text.reduce((acc: number, cur: string) => acc + cur.length, 0) : text.length,
          cleanedLength: cleanedText.length,
          durationSeconds: Number(durationSec),
        }
      });

    } catch (pipelineError: any) {
      clearTimeout(timeoutId);
      console.error("[Pipeline Error]:", pipelineError);

      if (pipelineError.name === "AbortError" || globalController.signal.aborted) {
        return NextResponse.json(
          { error: "The document analysis took too long and was aborted to prevent timeout. Please try with a smaller document." },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: pipelineError.message || "An error occurred during the multi-stage document processing." },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("[Critical API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error. Unable to process the request." },
      { status: 500 }
    );
  }
}