// ===============================
//  FIXED DIGITALOCEAN SPACES UPLOAD ROUTE
//  Full replacement for route.ts
// ===============================

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ------------------------------
// RESOLVE ENV VARS
// ------------------------------
const region =
  process.env.SPACES_REGION ||
  process.env.AWS_S3_REGION ||
  process.env.AWS_REGION;

const endpoint =
  process.env.SPACES_ENDPOINT ||
  process.env.AWS_S3_ENDPOINT;

const accessKeyId =
  process.env.SPACES_KEY ||
  process.env.AWS_ACCESS_KEY_ID;

const secretAccessKey =
  process.env.SPACES_SECRET ||
  process.env.AWS_SECRET_ACCESS_KEY;

const bucket =
  process.env.SPACES_BUCKET ||
  process.env.UPLOAD_BUCKET;

// Build S3 Client for DO Spaces
const s3 =
  region && endpoint && accessKeyId && secretAccessKey
    ? new S3Client({
        region,
        endpoint,
        forcePathStyle: false,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    : null;

// ------------------------------
// MAIN UPLOAD HANDLER
// ------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!s3 || !bucket) {
      console.error("❌ Spaces not configured:", {
        region,
        endpoint,
        hasKey: !!accessKeyId,
        hasSecret: !!secretAccessKey,
        bucket,
      });
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 500 }
      );
    }

    // Read file
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB" },
        { status: 400 }
      );
    }

    // Validate type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Upload PDF, Word, PowerPoint, Image, or Text files.",
        },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create unique key
    const originalName = file.name;
    const ext = originalName.includes(".")
      ? originalName.substring(originalName.lastIndexOf("."))
      : "";
    const key = `uploads/${Date.now()}-${randomUUID()}${ext}`;

    // Upload to Spaces
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Save document metadata
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        originalName,
        cloudStoragePath: key,
        fileType: file.type,
        fileSize: file.size,
        mimeType: file.type,
        processingStatus: "PENDING",
      },
    });

    // Start processing
    processDocumentAsync(document.id, key, file.type);

    return NextResponse.json({
      message: "File uploaded successfully",
      document: {
        id: document.id,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        processingStatus: document.processingStatus,
        uploadedAt: document.uploadedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document", detail: error?.message },
      { status: 500 }
    );
  }
}

// ------------------------------
// BACKGROUND DOCUMENT PROCESSING
// ------------------------------
async function processDocumentAsync(
  documentId: string,
  cloudStoragePath: string,
  fileType: string
) {
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: "PROCESSING" },
    });

    const { extractDocumentText } = await import(
      "@/lib/document-processor"
    );

    const result = await extractDocumentText(cloudStoragePath, fileType);

    if (result.error) {
      throw new Error(result.error);
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: "COMPLETED",
        extractedText: result.extractedText,
        processedAt: new Date(),
      },
    });

    console.log(
      `✅ Document ${documentId} processed. Word count: ${result.wordCount}`
    );
  } catch (error: any) {
    console.error("❌ Document processing error:", error);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: "FAILED",
        processingError: error?.message ?? "Unknown error",
      },
    });
  }
}
