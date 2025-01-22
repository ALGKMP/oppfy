import type { z } from "zod";

import { env } from "@oppfy/env";
import type { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { S3Repository } from "../../repositories/aws/s3";
import { CloudFrontService } from "./cloudfront";

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
  private cloudFrontService = new CloudFrontService();

  async uploadProfilePictureUrl({
    userId,
    contentLength,
  }: {
    userId: string;
    contentLength: number;
  }) {
    const key = `profile-pictures/${userId}.jpg`;

    const metadata = {
      user: userId,
    };

    const presignedUrl = await this.s3Repository.putObjectPresignedUrl({
      Key: key,
      Bucket: env.S3_PROFILE_BUCKET,
      ContentLength: contentLength,
      ContentType: "image/jpeg",
      Metadata: metadata,
    });

    // Invalidate the profile picture in CloudFront
    await this.cloudFrontService.invalidateProfilePicture(userId);

    return presignedUrl;
  }

  // Post for user on app
  async uploadPostForUserOnAppUrl({
    author,
    recipient,
    caption,
    height,
    width,
    contentLength,
    contentType,
    postId,
  }: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: ContentType;
    postId: string;
  }) {
    try {
      const currentDate = Date.now();
      const objectKey = `posts/${currentDate}-${recipient}-${author}.jpg`;

      caption = encodeURIComponent(caption);

      const presignedUrl = await this.s3Repository.putObjectPresignedUrl({
        Bucket: env.S3_POST_BUCKET,
        Key: objectKey,
        ContentLength: contentLength,
        ContentType: contentType,
        Metadata: {
          author,
          recipient,
          caption,
          height,
          width,
          type: "onApp",
          postId,
        },
      });


      return presignedUrl;
    } catch (err) {
      throw new DomainError(
        ErrorCode.S3_FAILED_TO_UPLOAD,
        "S3 failed while trying to upload post",
      );
    }
  }

  // post for user not on app
  async uploadPostForUserNotOnAppUrl({
    author,
    recipient,
    caption,
    height,
    width,
    contentLength,
    contentType,
    postId,
  }: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: ContentType;
    postId: string;
  }) {
    try {
      const currentDate = Date.now();
      const objectKey = `posts/${currentDate}-${recipient}-${author}.jpg`;

      caption = encodeURIComponent(caption);

      const presignedUrl = await this.s3Repository.putObjectPresignedUrl({
        Bucket: env.S3_POST_BUCKET,
        Key: objectKey,
        ContentLength: contentLength,
        ContentType: contentType,
        Metadata: {
          author,
          caption,
          height,
          width,
          recipient,
          postId,
          type: "notOnApp",
        },
      });


      return presignedUrl;
    } catch (err) {
      throw new DomainError(
        ErrorCode.S3_FAILED_TO_UPLOAD,
        "S3 failed while trying to upload post",
      );
    }
  }

  async putObjectPresignedUrl(
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
