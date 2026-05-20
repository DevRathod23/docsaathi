/**
 * Smart Chunking Optimization Layer
 * 
 * Splits clean text into larger dynamic chunks (8000-10000 characters) to drastically
 * minimize total chunk count (target 8-15 chunks), skip duplicate/tiny/boilerplate blocks,
 * and enforce a hard cap of maximum 15 chunks while preserving sequence order.
 */
export function chunkText(text: string, baseChunkSize: number = 9000): string[] {
  if (!text) return [];

  // 1. Dynamic Chunk Size Calculation
  // We want to guarantee we NEVER exceed 15 chunks. Since the text length is hard capped
  // at 100,000 characters, using a base chunk size of 9000 yields at most 12 chunks.
  // We dynamically recalculate the chunk size based on length if needed.
  const targetChunkCount = 14; 
  const chunkSize = Math.max(baseChunkSize, Math.ceil(text.length / targetChunkCount));
  console.log(`[Smart Chunking] Text length is ${text.length} chars. Using dynamic chunk size: ${chunkSize} chars.`);

  if (text.length <= chunkSize) {
    return [text];
  }

  const rawChunks: string[] = [];
  let currentChunk = "";

  // Split by double newlines to process paragraph blocks
  const paragraphs = text.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    const trimmedP = paragraph.trim();
    if (!trimmedP) continue;

    // If paragraph fits in current chunk, append it
    if ((currentChunk + (currentChunk ? "\n\n" : "") + trimmedP).length <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedP;
    } else {
      if (currentChunk) {
        rawChunks.push(currentChunk);
        currentChunk = "";
      }

      // If a single paragraph is larger than the dynamic chunkSize, split it by lines or sentences
      if (trimmedP.length > chunkSize) {
        const sentences = trimmedP.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [trimmedP];
        
        for (const sentence of sentences) {
          const trimmedS = sentence.trim();
          if (!trimmedS) continue;

          if ((currentChunk + (currentChunk ? " " : "") + trimmedS).length <= chunkSize) {
            currentChunk += (currentChunk ? " " : "") + trimmedS;
          } else {
            if (currentChunk) {
              rawChunks.push(currentChunk);
            }
            currentChunk = trimmedS;
          }
        }
      } else {
        currentChunk = trimmedP;
      }
    }
  }

  if (currentChunk) {
    rawChunks.push(currentChunk);
  }

  // 2. Smart Chunk Filtering (tiny, duplicates, low-information)
  const filteredChunks: string[] = [];
  const seenChunkHashes = new Set<string>();

  for (const chunk of rawChunks) {
    const trimmedChunk = chunk.trim();
    
    // Rule A: Skip empty or extremely tiny chunks (< 150 chars) unless it's the only content
    if (trimmedChunk.length < 150 && rawChunks.length > 1) {
      console.log(`[Chunk Filter] Dropped tiny chunk (${trimmedChunk.length} chars): "${trimmedChunk.substring(0, 40)}..."`);
      continue;
    }

    // Rule B: Duplicate Chunk Detection
    const normalized = trimmedChunk.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Create a 100-character signature of the normalized chunk
    const chunkSignature = normalized.substring(0, 100);
    if (seenChunkHashes.has(chunkSignature)) {
      console.log(`[Chunk Filter] Dropped duplicate/highly similar chunk: "${trimmedChunk.substring(0, 40)}..."`);
      continue;
    }
    seenChunkHashes.add(chunkSignature);

    // Rule C: Signature / Boilerplate Chunk Filtering
    // If a chunk consists mostly of empty form slots or repeated blanks (e.g. "Signature: ____", "Date: ____"), skip it
    const underscoreMatches = trimmedChunk.match(/_{3,}/g) || [];
    const dotMatches = trimmedChunk.match(/\.{4,}/g) || [];
    if ((underscoreMatches.length > 5 || dotMatches.length > 8) && trimmedChunk.length < 500) {
      console.log(`[Chunk Filter] Dropped boilerplate/empty signature chunk.`);
      continue;
    }

    filteredChunks.push(trimmedChunk);
  }

  // 3. Hard Cap Limit: Max 15 Chunks
  // Slice to keep at most 15 chunks to protect against excessive API calls in any extreme edge cases
  if (filteredChunks.length > 15) {
    console.log(`[Smart Chunking] Hard cap warning: sliced chunks from ${filteredChunks.length} to 15.`);
    return filteredChunks.slice(0, 15);
  }

  console.log(`[Smart Chunking] Generated ${filteredChunks.length} optimized chunk(s).`);
  return filteredChunks;
}
