// ===============================
//  DIGITALOCEAN SPACES UPLOAD ROUTE (CLEAN + CORRECT)
// ===============================

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ------------------------------
// RESOLVE ENV VARS (ONLY S3_* ARE USED)
// ------------------------------
const region = process.env.S3_REGION;
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const bucket = process.env.S3_BUCKET;

// Construct public base URL
// Example: https://atlas-maximus-storage.nyc3.digitaloceanspaces.com
const publicBaseUrl =
  bucket && region
    ? `https://${bucket}.${region}.digitaloceanspaces.com`
    : null;

// Build S3 Client
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

    // Validate storage configuration
    if (!s3 || !bucket) {
      console.error("❌ Storage not configured:", {
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB" },
        { status: 400 }
      );
    }

    // Allowed file types
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
    const objectKey = `uploads/${Date.now()}-${randomUUID()}${ext}`;

    // Upload to DigitalOcean Spaces
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
      })
    );

    // Build full public URL
    const cloudStoragePath =
      publicBaseUrl != null
        ? `${publicBaseUrl}/${objectKey}`
        : objectKey; // fallback

    // Save metadata
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        originalName,
        cloudStoragePath,
        fileType: file.type,
        fileSize: file.size,
        mimeType: file.type,
        processingStatus: "PENDING",
      },
    });

    // Kick off async processing
    processDocumentAsync(document.id, cloudStoragePath, file.type);

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
