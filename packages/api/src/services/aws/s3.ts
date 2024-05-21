import type { z } from "zod";

import type { trpcValidators } from "@oppfy/validators";

import { S3Repository } from "../../repositories/aws/s3";

type ContentType = "image/jpeg" | "image/png";

type PostMetadata = {
  author: string;
  recipient: string;
  caption: string;
};
type ProfilePictureMetadata = {
  user: string;
};
interface PutObjectPresignedUrlInput {
  Key: string;
  Bucket: string;
  ContentLength: number;
  ContentType: ContentType;
}

interface BasePutObjectPresignedUrlWithMetadataInput
  extends PutObjectPresignedUrlInput {
  Metadata: Record<string, string>;
}

interface PutObjectPresignedUrlWithPostMetadataInput
  extends BasePutObjectPresignedUrlWithMetadataInput {
  Metadata: PostMetadata;
}

interface PutObjectPresignedUrlWithProfilePictureMetadataInput
  extends BasePutObjectPresignedUrlWithMetadataInput {
  Metadata: ProfilePictureMetadata;
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
    putObjectCommandInput: PutObjectPresignedUrlWithPostMetadataInput,
  ) {
    return await this.s3Repository.putObjectPresignedUrl(putObjectCommandInput);
  }

  async putObjectPresignedUrlWithProfilePictureMetadata(
    putObjectCommandInput: PutObjectPresignedUrlWithProfilePictureMetadataInput,
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
