/**
 * Text Cleaning & Aggressive Compression Layer
 * 
 * Cleans extracted text by stripping OCR noise, normalizing whitespace,
 * dynamically identifying and removing repeating headers, footers, page numbers,
 * and stripping out repetitive boilerplate paragraphs (signature blocks, confidentiality notices).
 * Enforces a strict maximum length cap to ensure speed and prevent TPM issues.
 */
export function cleanText(text: string): string {
  if (!text) return "";

  // 1. Initial basic cleaning
  let cleaned = text;

  // Remove invalid/invisible Unicode control characters (except common whitespace like \n, \t)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, "");

  // Remove long typical OCR lines and garbage symbols
  cleaned = cleaned.replace(/[_|~]{3,}/g, " ");
  cleaned = cleaned.replace(/[-=_*]{4,}/g, " ");

  // 2. Page number and typical header/footer pagination pattern stripping
  // e.g. "Page 1 of 10", "Page 2", "[Page 24]", "Page - 5 -"
  cleaned = cleaned.replace(/\bPage\s*[-–—]?\s*\d+\s*(of\s*\d+)?\b/gi, "");
  cleaned = cleaned.replace(/\[\s*Page\s*\d+\s*\]/gi, "");

  // 3. Normalize newline characters
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 4. Dynamic Header/Footer Boilerplate Detection & Removal
  // We count identical lines. If a line appears repeatedly (> 3 times) and is of
  // substantial length (> 12 characters), it's highly likely a repeating document header,
  // foot note, company name, or boilerplate confidentiality label. We strip these dynamically.
  const lines = cleaned.split("\n");
  const lineCounts: Record<string, number> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 12) {
      lineCounts[trimmed] = (lineCounts[trimmed] || 0) + 1;
    }
  }

  const boilerplateLines = new Set<string>();
  for (const [line, count] of Object.entries(lineCounts)) {
    if (count > 3) {
      boilerplateLines.add(line.toLowerCase().replace(/[^a-z0-9]/g, ""));
    }
  }

  const filteredLines = lines.filter(line => {
    const normalized = line.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    return !boilerplateLines.has(normalized);
  });

  cleaned = filteredLines.join("\n");

  // 5. Paragraph-Level Duplicate & Boilerplate Removal
  // We split by paragraph, strip duplicate paragraphs (like repeated signature grids,
  // template warnings, notary seals, or duplicate operational instructions).
  const paragraphs = cleaned.split(/\n\s*\n/);
  const seenParagraphs = new Set<string>();
  const uniqueParagraphs: string[] = [];

  // Known low-value boilerplate phrases to strip if they repeat or are standalone
  const boilerplateKeywords = [
    "confidentiality notice", "confidential and proprietary", "all rights reserved",
    "this document contains confidential information", "do not distribute",
    "signed, sealed and delivered", "in the witness whereof", "presence of the witnesses",
    "stamped and signed", "notary public", "subject to change without notice"
  ];

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;

    // Standardize paragraph for similarity matching (lowercase, strip special chars and spaces)
    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalized.length === 0) continue;

    // 1. Skip exact/near duplicate paragraphs
    if (seenParagraphs.has(normalized)) {
      console.log(`[Deduplication] Removed duplicate paragraph: "${trimmed.substring(0, 50)}..."`);
      continue;
    }

    // 2. Skip template/low-value legal boilerplate if seen more than once
    let isBoilerplate = false;
    for (const keyword of boilerplateKeywords) {
      if (trimmed.toLowerCase().includes(keyword)) {
        // If it's standard confidentiality/notary boilerplate and we've already kept one, skip subsequent ones
        const keywordKey = `bp_${keyword.replace(/\s+/g, "")}`;
        if (seenParagraphs.has(keywordKey)) {
          isBoilerplate = true;
          break;
        }
        seenParagraphs.add(keywordKey); // mark that we kept the first instance
      }
    }

    if (isBoilerplate) {
      console.log(`[Boilerplate] Stripped repeating boilerplate block: "${trimmed.substring(0, 50)}..."`);
      continue;
    }

    seenParagraphs.add(normalized);
    uniqueParagraphs.push(trimmed);
  }

  cleaned = uniqueParagraphs.join("\n\n");

  // 6. Final Whitespace and Space Normalization
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/ \n/g, "\n").replace(/\n /g, "\n");
  cleaned = cleaned.trim();

  // 7. Hard Production Limit: Max Cleaned Characters = 100,000
  // If the document exceeds 100,000 characters after cleaning, we keep the first 100,000 chars,
  // which maintains crucial contextual integrity for legal/medical summary needs.
  if (cleaned.length > 100000) {
    console.log(`[Production Limit] Truncated document text from ${cleaned.length} to 100000 characters.`);
    cleaned = cleaned.substring(0, 100000) + "\n\n[Document truncated for length optimization]";
  }

  return cleaned;
}
