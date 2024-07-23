import type { z } from "zod";

import type { sharedValidators } from "@oppfy/validators";

import { S3Repository } from "../../repositories/aws/s3";

type ContentType = z.infer<typeof sharedValidators.media.postContentType>;

interface PutObjectPresignedUrlInput {
  Key: string;
  Bucket: string;
  ContentLength: number;
  ContentType: ContentType;
}

export interface BasePutObjectPresignedUrlWithMetadataInput<T>
  extends PutObjectPresignedUrlInput {
  Metadata: T;
}

interface GetObjectPresignedUrlInput {
  Key: string;
  Bucket: string;
}

export type PostMetadataUserOnApp = z.infer<
  typeof sharedValidators.aws.s3ObjectMetadataForUserOnAppSchema
>;

export type PostMetadataUserNotOnApp = z.infer<
  typeof sharedValidators.aws.s3ObjectMetadataForUserNotOnAppSchema
>;

export type PostMetadata = PostMetadataUserOnApp | PostMetadataUserNotOnApp;

export type ProfilePictureMetadata = z.infer<
  typeof sharedValidators.aws.s3ObjectMetadataForProfilePicturesSchema
>;

export class S3Service {
  private s3Repository = new S3Repository();

  async putObjectPresignedUrl(
    putObjectCommandInput: PutObjectPresignedUrlInput,
  ) {
    return await this.s3Repository.putObjectPresignedUrl(putObjectCommandInput);
  }

  async putObjectPresignedUrlWithPostMetadata(
    putObjectCommandInput: BasePutObjectPresignedUrlWithMetadataInput<PostMetadata>,
  ) {
    return await this.s3Repository.putObjectPresignedUrl(putObjectCommandInput);
  }

  async putObjectPresignedUrlWithProfilePictureMetadata(
    putObjectCommandInput: BasePutObjectPresignedUrlWithMetadataInput<ProfilePictureMetadata>,
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
