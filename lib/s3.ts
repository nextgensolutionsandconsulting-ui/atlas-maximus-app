import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// =====================================
// DigitalOcean Spaces / S3 configuration
// =====================================

const REGION = process.env.S3_REGION || "nyc3";
const ENDPOINT =
  process.env.S3_ENDPOINT || "https://nyc3.digitaloceanspaces.com";
const BUCKET = process.env.S3_BUCKET;
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

// Optional prefix for organizing objects in the bucket
// (e.g., "atlas/" → keys become "atlas/uploads/...")
const FOLDER_PREFIX = process.env.S3_FOLDER_PREFIX || "";

// Log a warning if config is incomplete (helps in dev)
if (!BUCKET || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.warn("[lib/s3] S3 storage is not fully configured", {
    hasBucket: !!BUCKET,
    hasKey: !!ACCESS_KEY_ID,
    hasSecret: !!SECRET_ACCESS_KEY,
  });
}

// Single S3 client instance used for all operations
const s3Client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted style
  credentials:
    ACCESS_KEY_ID && SECRET_ACCESS_KEY
      ? {
          accessKeyId: ACCESS_KEY_ID,
          secretAccessKey: SECRET_ACCESS_KEY,
        }
      : undefined,
});

// =====================================
// Helper: get bucket name (with safety)
// =====================================

function requireBucket(): string {
  if (!BUCKET) {
    throw new Error("S3_BUCKET environment variable is not set");
  }
  return BUCKET;
}

// =====================================
// Public API
// =====================================

export async function uploadFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const bucketName = requireBucket();

  // Make filename safe-ish for S3 key
  const safeName = fileName.replace(/[^\w.\-]/g, "_");
  const key = `${FOLDER_PREFIX}uploads/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
  });

  await s3Client.send(command);
  return key; // relative key (e.g., "uploads/1234-file.docx")
}

export async function downloadFile(key: string): Promise<string> {
  const bucketName = requireBucket();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  // Signed URL valid for 1 hour
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function downloadFileBuffer(key: string): Promise<Buffer | null> {
  try {
    const bucketName = requireBucket();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return null;
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error downloading file as buffer:", error);
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  const bucketName = requireBucket();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

export async function renameFile(
  oldKey: string,
  newKey: string
): Promise<string> {
  // S3/Spaces has no native rename; we copy & delete
  const bucketName = requireBucket();

  // Get a signed URL for the old file
  const downloadUrl = await downloadFile(oldKey);

  // Download contents via signed URL
  const response = await fetch(downloadUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  // Upload with new key
  const finalKey = `${FOLDER_PREFIX}${newKey}`;
  await uploadFile(buffer, finalKey);

  // Delete old file
  await deleteFile(oldKey);

  return finalKey;
}
