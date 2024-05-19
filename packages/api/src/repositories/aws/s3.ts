import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3/dist-types/commands";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3 } from "@oppfy/s3";

import { handleAwsErrors } from "../../errors";

export type { GetObjectCommandInput, PutObjectCommandInput };

const FIVE_MINUTES = 300;

export class S3Repository {
  @handleAwsErrors
  async putObjectPresignedUrl(putObjectCommandInput: PutObjectCommandInput) {
    const command = new PutObjectCommand(putObjectCommandInput);
    return await getSignedUrl(s3, command, { expiresIn: FIVE_MINUTES });
  }

  @handleAwsErrors
  async getObjectPresignedUrl(getObjectCommandInput: GetObjectCommandInput) {
    const command = new GetObjectCommand(getObjectCommandInput);
    return await getSignedUrl(s3, command, { expiresIn: FIVE_MINUTES });
  }

  @handleAwsErrors
  async deleteObject(bucket: string, key: string) {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    return await s3.send(command);
  }
}
