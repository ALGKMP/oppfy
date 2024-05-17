import type { z } from "zod";

import type { trpcValidators } from "@acme/validators";

import { AwsRepository } from "../repositories/aws";

type ContentType = "image/jpeg" | "image/png";

type PostMetadata = z.infer<typeof trpcValidators.post.metadata>;
type ProfilePictureMetadata = z.infer<
  typeof trpcValidators.post.profilePictureMetadata
>;

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

export class AwsService {
  private awsRepository = new AwsRepository();

  async putObjectPresignedUrl(
    putObjectCommandInput: PutObjectPresignedUrlInput,
  ) {
    return await this.awsRepository.putObjectPresignedUrl(
      putObjectCommandInput,
    );
  }

  async putObjectPresignedUrlWithPostMetadata(
    putObjectCommandInput: PutObjectPresignedUrlWithPostMetadataInput,
  ) {
    return await this.awsRepository.putObjectPresignedUrl(
      putObjectCommandInput,
    );
  }

  async putObjectPresignedUrlWithProfilePictureMetadata(
    putObjectCommandInput: PutObjectPresignedUrlWithProfilePictureMetadataInput,
  ) {
    return await this.awsRepository.putObjectPresignedUrl(
      putObjectCommandInput,
    );
  }

  async getObjectPresignedUrl(
    getObjectCommandInput: GetObjectPresignedUrlInput,
  ) {
    return await this.awsRepository.getObjectPresignedUrl(
      getObjectCommandInput,
    );
  }

  async deleteObject(bucket: string, key: string) {
    return await this.awsRepository.deleteObject(bucket, key);
  }
}
