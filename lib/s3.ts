
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const key = `${folderPrefix}uploads/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
  });

  await s3Client.send(command);
  return key; // Return the cloud_storage_path
}

export async function downloadFile(key: string): Promise<string> {
  const { bucketName } = getBucketConfig();
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  // Return signed URL for download
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
}

export async function downloadFileBuffer(key: string): Promise<Buffer | null> {
  try {
    const { bucketName } = getBucketConfig();
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error downloading file as buffer:', error);
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getBucketConfig();
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // S3 doesn't have a rename operation, so we copy and delete
  const { bucketName } = getBucketConfig();
  
  // First get the old file
  const downloadUrl = await downloadFile(oldKey);
  
  // Download the content
  const response = await fetch(downloadUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  
  // Upload with new key
  await uploadFile(buffer, newKey);
  
  // Delete old file
  await deleteFile(oldKey);
  
  return newKey;
}
