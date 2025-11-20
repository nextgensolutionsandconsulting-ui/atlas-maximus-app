import mammoth from "mammoth";
import { downloadFileBuffer } from "./s3";

export interface DocumentProcessingResult {
  extractedText: string;
  pageCount?: number;
  wordCount: number;
  error?: string;
}

/**
 * Convert a cloudStoragePath (URL or key) into an S3 key
 */
function resolveS3Key(cloudStoragePath: string): string {
  // If it's already an S3 key (starts with uploads/)
  if (cloudStoragePath.startsWith("uploads/")) {
    return cloudStoragePath;
  }

  // If it's a full URL, extract the path after the domain
  try {
    const url = new URL(cloudStoragePath);
    return url.pathname.startsWith("/")
      ? url.pathname.substring(1) // remove leading slash
      : url.pathname;
  } catch {
    // fallback – treat as raw key
    return cloudStoragePath;
  }
}

/**
 * Extract text from various document formats
 */
export async function extractDocumentText(
  cloudStoragePath: string,
  fileType: string
): Promise<DocumentProcessingResult> {
  try {
    // Convert URL → S3 key (critical for DO Spaces)
    const s3Key = resolveS3Key(cloudStoragePath);

    // Download file buffer
    const buffer = await downloadFileBuffer(s3Key);

    if (!buffer) {
      return {
        extractedText: "",
        wordCount: 0,
        error: "Failed to download file from storage",
      };
    }

    let extractedText = "";
    let pageCount: number | undefined;

    // PDF
    if (fileType === "application/pdf") {
      try {
        // @ts-ignore – pdf-parse CJS module
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
        pageCount = pdfData.numpages;
      } catch (err) {
        console.error("PDF parsing error:", err);
        extractedText =
          "Unable to extract text from PDF file. File may be password-protected or corrupted.";
      }
    }
    // WORD
    else if (
      fileType === "application/msword" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (err) {
        console.error("Word document parsing error:", err);
        extractedText =
          "Unable to extract text from Word document. File may be corrupted.";
      }
    }
    // POWERPOINT
    else if (
      fileType === "application/vnd.ms-powerpoint" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      try {
        const pptxParser = require("pptx-parser");
        const slides = await pptxParser.parseBuffer(buffer);
        extractedText = slides
          .map((slide: any, idx: number) => {
            const parts = [];
            if (slide.title) parts.push(`Slide ${idx + 1} Title: ${slide.title}`);
            if (slide.text) parts.push(slide.text);
            return parts.join("\n");
          })
          .join("\n\n");
      } catch (err) {
        console.error("PPTX parsing error:", err);
        extractedText =
          "Unable to extract text from PowerPoint file. File may be password-protected or corrupted.";
      }
    }
    // PLAIN TEXT
    else if (fileType === "text/plain") {
      extractedText = buffer.toString("utf-8");
    }
    // IMAGE
    else if (fileType.startsWith("image/")) {
      extractedText =
        "[Image file: Atlas Maximus can analyze images visually. When referencing this image, ask Atlas to describe or interpret the visual content.]";
    }
    // UNKNOWN FORMATS
    else {
      extractedText = "[Unsupported file type for text extraction]";
    }

    // Cleanup
    extractedText = extractedText.trim();
    if (!extractedText) {
      extractedText =
        "[No text content could be extracted from this document]";
    }

    // Word count
    const wordCount = extractedText
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    return { extractedText, pageCount, wordCount };
  } catch (error) {
    console.error("Document text extraction error:", error);
    return {
      extractedText: "",
      wordCount: 0,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during text extraction",
    };
  }
}

/**
 * Search documents for relevant context
 */
export function findRelevantDocumentContent(
  documents: Array<{
    id?: string;
    originalName: string;
    extractedText: string | null;
  }>,
  query: string,
  maxChars: number = 3000
): { context: string; usedDocumentIds: string[] } {
  if (!documents || documents.length === 0) {
    return { context: "", usedDocumentIds: [] };
  }

  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter((w) => w.length > 3);

  const scoredDocs = documents
    .filter((d) => d.extractedText)
    .map((doc) => {
      const lower = (doc.extractedText || "").toLowerCase();
      let score = 0;
      keywords.forEach((k) => {
        score += (lower.match(new RegExp(k, "g")) || []).length;
      });
      return { ...doc, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredDocs.length === 0) {
    return { context: "", usedDocumentIds: [] };
  }

  let context = "### Relevant Knowledge from Uploaded Documents:\n\n";
  let charsUsed = context.length;
  const used: string[] = [];

  for (const doc of scoredDocs.slice(0, 3)) {
    const header = `**From: ${doc.originalName}**\n`;
    const available = maxChars - charsUsed - header.length - 100;
    if (available <= 0) break;

    const excerpt = extractRelevantExcerpts(
      doc.extractedText!,
      keywords,
      available
    );

    if (excerpt) {
      context += header + excerpt + "\n\n";
      charsUsed += header.length + excerpt.length + 2;
      if (doc.id) used.push(doc.id);
    }
  }

  return { context, usedDocumentIds: used };
}

/**
 * Extract relevant excerpts
 */
function extractRelevantExcerpts(
  text: string,
  keywords: string[],
  maxChars: number
): string {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const scored = sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      let score = 0;
      keywords.forEach((k) => {
        if (lower.includes(k)) score++;
      });
      return { sentence, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  let excerpt = "";
  for (const s of scored) {
    if (excerpt.length + s.sentence.length + 2 > maxChars) break;
    excerpt += s.sentence + ". ";
  }

  return excerpt || text.substring(0, maxChars);
}
