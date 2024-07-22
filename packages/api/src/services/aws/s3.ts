import { S3Repository } from "../../repositories/aws/s3";

type ContentType = "image/jpeg" | "image/png";

type BaseMetadata = Record<string, string>;

interface PostForUserOnAppMetadata extends BaseMetadata {
  author: string;
  recipient: string;
  caption: string;
  width: string;
  height: string;
  type: "onApp";
}

interface PostForUserNotOnAppMetadata extends BaseMetadata {
  author: string;
  phoneNumber: string;
  caption: string;
  width: string;
  height: string;
  type: "notOnApp";
}

interface ProfilePictureMetadata extends BaseMetadata {
  user: string;
}

export type Metadata =
  | PostForUserOnAppMetadata
  | PostForUserNotOnAppMetadata
  | ProfilePictureMetadata;

interface PutObjectPresignedUrlInput {
  Key: string;
  Bucket: string;
  ContentLength: number;
  ContentType: ContentType;
  Metadata: Metadata
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
