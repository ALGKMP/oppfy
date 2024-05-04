import type { z } from "zod";

import type { trpcValidators } from "@acme/validators";

import { AwsRepository } from "../repositories/aws";

type PostMetadata = z.infer<typeof trpcValidators.post.metadata>;
type ProfilePictureMetadata = z.infer<
  typeof trpcValidators.post.profilePictureMetadata
>;

interface BasePutObjectPresignedUrlInput {
  Bucket: string;
  Key: string;
  ContentLength: number;
  ContentType: string;
}

type PutObjectPresignedUrlInput = BasePutObjectPresignedUrlInput;

interface BasePutObjectPresignedUrlWithMetadataInput {
  Bucket: string;
  Key: string;
  ContentLength: number;
  ContentType: string;
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
  Bucket: string;
  Key: string;
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
