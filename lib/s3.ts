"use server";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

interface UploadResponse {
  key: string;
  url: string;
  expiresAt?: Date;
}
interface FileMetadata {
  userId?: string;
  isTemporary?: boolean;
  originalName: string;
  contentType: string;
  tool: string;
}
interface KeyGenerationParams {
  userId?: string;
  tool: string;
  isTemporary?: boolean;
}

export async function generateKey(
  fileName: string,
  metadata: KeyGenerationParams,
): Promise<string> {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  if (metadata.isTemporary) {
    return `temp/${sanitizedFileName}`;
  }

  if (!metadata.userId) {
    throw new Error("User ID is required");
  }

  return `${metadata.tool}/${metadata.userId}/${sanitizedFileName}`;
}

export async function uploadFile(
  file: Buffer,
  metadata: FileMetadata,
): Promise<UploadResponse> {
  const key = await generateKey(metadata.originalName, {
    userId: metadata.userId,
    tool: metadata.tool,
    isTemporary: metadata.isTemporary,
  });

  const expiresIn = 30 * 60 * 1000; // 30 minutes
  const expiresAt = new Date(Date.now() + expiresIn);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: metadata.contentType,
  });

  await s3Client.send(command);
  const url = await getSignedDownloadUrl(key);

  return {
    key,
    url,
    expiresAt,
  };
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function listUserFiles(
  userId: string,
  tool: string,
): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: `${tool}/${userId}/`,
  });

  const response = await s3Client.send(command);
  return response.Contents?.map((file) => file.Key!) || [];
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}
