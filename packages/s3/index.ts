import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3/dist-types/commands";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@oppfy/env";

const FIVE_MINUTES = 300;

export class S3 {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async putObjectPresignedUrl(
    putObjectCommandInput: PutObjectCommandInput,
  ): Promise<string> {
    const command = new PutObjectCommand(putObjectCommandInput);
    return await getSignedUrl(this.client, command, {
      expiresIn: FIVE_MINUTES,
    });
  }

  async getObjectPresignedUrl(
    getObjectCommandInput: GetObjectCommandInput,
  ): Promise<string> {
    const command = new GetObjectCommand(getObjectCommandInput);
    return await getSignedUrl(this.client, command, {
      expiresIn: FIVE_MINUTES,
    });
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await this.client.send(command);
  }

  async createPostPresignedUrl({
    bucket,
    objectKey,
    contentLength,
    contentType,
    metadata,
  }: {
    bucket: string;
    objectKey: string;
    contentLength: number;
    contentType: "image/jpeg" | "image/png" | "image/heic";
    metadata: Record<string, string>;
  }): Promise<string> {
    return await this.putObjectPresignedUrl({
      Bucket: bucket,
      Key: objectKey,
      ContentLength: contentLength,
      ContentType: contentType,
      Metadata: metadata,
    });
  }

  async createProfilePicturePresignedUrl({
    userId,
    contentLength,
  }: {
    userId: string;
    contentLength: number;
  }): Promise<string> {
    const key = `profile-pictures/${userId}.jpg`;
    const metadata = { user: userId };

    return await this.putObjectPresignedUrl({
      Key: key,
      Bucket: env.S3_PROFILE_BUCKET,
      ContentLength: contentLength,
      ContentType: "image/jpeg",
      Metadata: metadata,
    });
  }
}

// Export a singleton instance
export const s3 = new S3();
