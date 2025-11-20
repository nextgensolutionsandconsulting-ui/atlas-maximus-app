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
 * Search documents for relevant context based on a query
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

  // Simple keyword-based search
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter((word) => word.length > 3);

  // Score each document based on keyword matches
  const scoredDocs = documents
    .filter((doc) => doc.extractedText && doc.extractedText.length > 0)
    .map((doc) => {
      const textLower = (doc.extractedText || "").toLowerCase();
      let score = 0;

      keywords.forEach((keyword) => {
        const matches = textLower.match(new RegExp(keyword, "g")) || [];
        score += matches.length;
      });

      return { ...doc, score };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredDocs.length === 0) {
    return { context: "", usedDocumentIds: [] };
  }

  // Build context from top documents
  let context = "### Relevant Knowledge from Uploaded Documents:\n\n";
  let charsUsed = context.length;
  const usedDocumentIds: string[] = [];

  for (const doc of scoredDocs.slice(0, 3)) {
    // Top 3 relevant docs
    const docText = doc.extractedText || "";
    const docHeader = `**From: ${doc.originalName}**\n`;
    const availableChars = maxChars - charsUsed - docHeader.length - 100; // buffer

    if (availableChars <= 0) break;

    // Extract relevant excerpts
    const excerpts = extractRelevantExcerpts(docText, keywords, availableChars);

    if (excerpts) {
      context += docHeader + excerpts + "\n\n";
      charsUsed += docHeader.length + excerpts.length + 2;

      // Track which documents were used
      if (doc.id) {
        usedDocumentIds.push(doc.id);
      }
    }
  }

  return { context, usedDocumentIds };
}

/**
 * Extract relevant text excerpts based on keywords
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

  // Score sentences by keyword presence
  const scoredSentences = sentences
    .map((sentence) => {
      const sentenceLower = sentence.toLowerCase();
      let score = 0;
      keywords.forEach((keyword) => {
        if (sentenceLower.includes(keyword)) score++;
      });
      return { sentence, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Build excerpt from top sentences
  let excerpt = "";
  for (const { sentence } of scoredSentences) {
    if (excerpt.length + sentence.length + 2 > maxChars) break;
    if (excerpt) excerpt += " ";
    excerpt += sentence + ".";
  }

  return excerpt || text.substring(0, maxChars);
}

/**
 * Search user contributions for relevant experiences and solutions
 * (restored so app/api/chat/route.ts can import it)
 */
export function findRelevantUserContributions(
  contributions: Array<{
    id: string;
    contributionType: string;
    originalQuestion: string;
    userExperience: string;
    scenario?: string | null;
    agileRole?: string | null;
    tags: string[];
    helpfulCount: number;
    user?: { name?: string | null; agileRole?: string | null };
  }>,
  query: string,
  maxChars: number = 2000
): string {
  if (!contributions || contributions.length === 0) {
    return "";
  }

  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter((word) => word.length > 3);

  // Score contributions based on relevance
  const scoredContributions = contributions
    .map((contrib) => {
      let score = 0;
      const combinedText = `${contrib.originalQuestion} ${contrib.userExperience} ${
        contrib.scenario || ""
      } ${contrib.tags.join(" ")}`.toLowerCase();

      // Keyword matching
      keywords.forEach((keyword) => {
        const matches = combinedText.match(new RegExp(keyword, "g")) || [];
        score += matches.length * 2;
      });

      // Bonus for helpful contributions
      score += contrib.helpfulCount * 0.5;

      // Bonus for matching tags
      contrib.tags.forEach((tag) => {
        if (queryLower.includes(tag.toLowerCase())) {
          score += 3;
        }
      });

      return { ...contrib, score };
    })
    .filter((contrib) => contrib.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredContributions.length === 0) {
    return "";
  }

  // Build context from top contributions
  let context = "### Community Experiences & Solutions (from Atlas users):\n\n";
  let charsUsed = context.length;

  for (const contrib of scoredContributions.slice(0, 4)) {
    // Top 4 relevant contributions
    const contributorName = contrib.user?.name || "An Atlas user";
    const contributorRole = contrib.agileRole
      ? ` (${contrib.agileRole.replace(/_/g, " ")})`
      : "";

    const contributionText =
      `**${contributorName}${contributorRole} shared their ${contrib.contributionType
        .toLowerCase()
        .replace(/_/g, " ")}:**\n` +
      `Q: "${contrib.originalQuestion.substring(0, 150)}${
        contrib.originalQuestion.length > 150 ? "..." : ""
      }"\n` +
      `A: ${contrib.userExperience.substring(0, 400)}${
        contrib.userExperience.length > 400 ? "..." : ""
      }\n` +
      `${contrib.scenario ? `Context: ${contrib.scenario.substring(0, 200)}\n` : ""}` +
      `(${contrib.helpfulCount} users found this helpful)\n\n`;

    if (charsUsed + contributionText.length > maxChars) {
      break;
    }

    context += contributionText;
    charsUsed += contributionText.length;
  }

  return context;
}
