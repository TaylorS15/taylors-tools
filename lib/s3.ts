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

export interface UploadResponse {
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

export async function generateS3Key(
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

export async function uploadS3File(
  file: Buffer,
  metadata: FileMetadata,
): Promise<string> {
  const key = await generateS3Key(metadata.originalName, {
    userId: metadata.userId,
    tool: metadata.tool,
    isTemporary: metadata.isTemporary,
  });

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: metadata.contentType,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to upload file");
  }
  const url = await getSignedS3DownloadUrl(key);

  return url;
}

export async function getSignedS3DownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function listUserS3Files(
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

export async function deleteS3File(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}
