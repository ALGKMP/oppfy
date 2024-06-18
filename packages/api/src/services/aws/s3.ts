import type { z } from "zod";

import type { trpcValidators } from "@oppfy/validators";

import { S3Repository } from "../../repositories/aws/s3";

type ContentType = "image/jpeg" | "image/png";

interface Metadata {
  [key: string]: string;
}

interface PostMetadata extends Metadata {
  author: string;
  recipient: string;
  caption: string;
  width: string;
  height: string;
}

interface ProfilePictureMetadata extends Metadata {
  user: string;
}

interface PutObjectPresignedUrlInput {
  Key: string;
  Bucket: string;
  ContentLength: number;
  ContentType: ContentType;
  Metadata: PostMetadata | ProfilePictureMetadata;
}

interface GetObjectPresignedUrlInput {
  Key: string;
  Bucket: string;
}

export class S3Service {
  private s3Repository = new S3Repository();

  async putObjectPresignedUrl(
    putObjectCommandInput: PutObjectPresignedUrlInput,
  ) {
    return await this.s3Repository.putObjectPresignedUrl(putObjectCommandInput);
  }

  async putObjectPresignedUrlWithPostMetadata(
    putObjectCommandInput: PutObjectPresignedUrlInput,
  ) {
    return await this.s3Repository.putObjectPresignedUrl(putObjectCommandInput);
  }

  async putObjectPresignedUrlWithProfilePictureMetadata(
    putObjectCommandInput: PutObjectPresignedUrlInput,
  ) {
    return await this.s3Repository.putObjectPresignedUrl(putObjectCommandInput);
  }

  async getObjectPresignedUrl(
    getObjectCommandInput: GetObjectPresignedUrlInput,
  ) {
    return await this.s3Repository.getObjectPresignedUrl(getObjectCommandInput);
  }

  async deleteObject(bucket: string, key: string) {
    return await this.s3Repository.deleteObject(bucket, key);
  }
}
