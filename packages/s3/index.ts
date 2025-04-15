import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@oppfy/env";

const FIVE_MINUTES = 300;

export type ImageContentType = "image/jpeg" | "image/png" | "image/heic";
export type VideoContentType = "video/mp4";

export type PostObjectKey = `posts/${number}-${string}-${string}.jpg`;

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

  async createPostPresignedUrl({
    authorUserId,
    recipientUserId,
    contentLength,
    contentType,
    metadata,
  }: {
    authorUserId: string;
    recipientUserId: string;
    contentLength: number;
    contentType: ImageContentType;
    metadata: { postid: string };
  }): Promise<{ presignedUrl: string; key: string }> {
    const key =
      `posts/${Date.now()}-${recipientUserId}-${authorUserId}.jpg` satisfies PostObjectKey;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: env.S3_POST_BUCKET,
      ContentLength: contentLength,
      ContentType: contentType,
      Metadata: metadata,
    });

    const presignedUrl = await getSignedUrl(this.client, command, {
      expiresIn: FIVE_MINUTES,
    });

    return { presignedUrl, key };
  }

  async createProfilePicturePresignedUrl({
    userId,
    contentLength,
    contentType,
    metadata,
  }: {
    userId: string;
    metadata: { user: string };
    contentLength: number;
    contentType: ImageContentType;
  }): Promise<{ presignedUrl: string; key: string }> {
    const key = `profile-pictures/${userId}.jpg`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: env.S3_PROFILE_BUCKET,
      ContentLength: contentLength,
      ContentType: contentType,
      Metadata: metadata,
    });

    const presignedUrl = await getSignedUrl(this.client, command, {
      expiresIn: FIVE_MINUTES,
    });

    return { presignedUrl, key };
  }
}
