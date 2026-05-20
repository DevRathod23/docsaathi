/**
 * Document Type Detection Layer
 * 
 * Uses fast, keyword-based detection to classify a document as either "medical" or "legal".
 * This completely avoids using the LLM for classification, reducing token usage and increasing speed.
 */
export function detectDocType(text: string): "medical" | "legal" {
  if (!text) return "medical"; // Default to medical if empty

  const normalizedText = text.toLowerCase();

  // Keyword banks
  const medicalKeywords = [
    "diagnosis", "glucose", "hemoglobin", "blood pressure", "prescription",
    "doctor", "physician", "patient", "clinic", "hospital", "symptoms", 
    "treatment", "therapy", "medication", "lab report", "pathology", 
    "dosage", "capsule", "tablet", "thyroid", "creatinine", "urea", "cholesterol",
    "cardiac", "pulse", "wbc", "rbc", "platelet", "mri", "ct scan", 
    "ultrasound", "x-ray", "clinical", "disease", "serum", "plasma", "urine",
    "biopsy", "infection", "vaccine", "allergy", "anesthesia", "surgery", 
    "cardiology", "neurology", "oncology", "pediatric", "radiology"
  ];

  const legalKeywords = [
    "agreement", "clause", "liability", "termination", "indemnify", 
    "indemnification", "contract", "lease", "tenant", "landlord", "lessor", 
    "lessee", "hereby", "herein", "thereof", "parties", "party", "executed", 
    "provision", "provisions", "court", "lawsuit", "jurisdiction", "witness", 
    "notary", "signature", "stamp duty", "dispute", "breach", "covenant", 
    "default", "damages", "force majeure", "arbitration", "intellectual property",
    "confidentiality", "governing law", "severability", "warranty", "attorney",
    "advocate", "counsel", "legal", "statute", "regulation"
  ];

  let medicalCount = 0;
  let legalCount = 0;

  // Count occurrences of medical keywords
  for (const keyword of medicalKeywords) {
    // Escape regex characters just in case
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "g");
    const matches = normalizedText.match(regex);
    if (matches) {
      medicalCount += matches.length;
    }
  }

  // Count occurrences of legal keywords
  for (const keyword of legalKeywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "g");
    const matches = normalizedText.match(regex);
    if (matches) {
      legalCount += matches.length;
    }
  }

  console.log(`DocType Detection: Medical Score = ${medicalCount}, Legal Score = ${legalCount}`);

  // Return the type with the highest count, defaulting to medical if tied or no keywords found
  if (legalCount > medicalCount) {
    return "legal";
  }
  
  return "medical";
}
