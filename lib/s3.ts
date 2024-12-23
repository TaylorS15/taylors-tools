import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
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

export class S3FileHandler {
  private static async generateKey(
    fileName: string,
    metadata: { userId?: string; tool: string; isTemporary?: boolean },
  ): Promise<string> {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    if (metadata.isTemporary) {
      return `temp/${timestamp}-${sanitizedFileName}`;
    }

    if (!metadata.userId) {
      throw new Error("User ID is required");
    }

    return `${metadata.tool}/${metadata.userId}/${timestamp}-${sanitizedFileName}`;
  }

  static async uploadFile(
    file: Buffer,
    metadata: FileMetadata,
  ): Promise<UploadResponse> {
    const key = await this.generateKey(metadata.originalName, {
      userId: metadata.userId,
      tool: metadata.tool,
      isTemporary: metadata.isTemporary,
    });

    const expiresIn = metadata.isTemporary ? 30 * 60 : undefined; // 30 minutes in seconds

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: metadata.contentType,
      Metadata: {
        userId: metadata.userId || "anonymous",
        tool: metadata.tool,
        isTemporary: String(!!metadata.isTemporary),
        originalName: metadata.originalName,
        expiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : "",
      },
    });

    await s3Client.send(command);

    const url = await this.getSignedUrl(key);
    return {
      key,
      url,
      ...(expiresIn && { expiresAt: new Date(Date.now() + expiresIn * 1000) }),
    };
  }

  static async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  static async listUserFiles(userId: string, tool: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${tool}/${userId}/`,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map((file) => file.Key!) || [];
  }

  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }
}
