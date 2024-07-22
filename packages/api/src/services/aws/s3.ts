import { S3Repository } from "../../repositories/aws/s3";

type ContentType = "image/jpeg" | "image/png";

type Metadata = Record<string, string>;

interface PostForUserOnAppMetadata extends Metadata {
  author: string;
  recipient: string;
  caption: string;
  width: string;
  height: string;
  type: "onApp";
}

interface PostForUserNotOnAppMetadata extends Metadata {
  author: string;
  phoneNumber: string;
  caption: string;
  width: string;
  height: string;
  type: "notOnApp";
}

interface ProfilePictureMetadata extends Metadata {
  user: string;
}

interface PutObjectPresignedUrlInput {
  Key: string;
  Bucket: string;
  ContentLength: number;
  ContentType: ContentType;
  Metadata:
    | PostForUserOnAppMetadata
    | PostForUserNotOnAppMetadata
    | ProfilePictureMetadata;
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
