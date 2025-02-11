import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3/dist-types/commands";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@oppfy/env";

const FIVE_MINUTES = 300;

const client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const s3 = {
  client,

  async putObjectPresignedUrl(putObjectCommandInput: PutObjectCommandInput) {
    const command = new PutObjectCommand(putObjectCommandInput);
    return await getSignedUrl(client, command, { expiresIn: FIVE_MINUTES });
  },

  async getObjectPresignedUrl(getObjectCommandInput: GetObjectCommandInput) {
    const command = new GetObjectCommand(getObjectCommandInput);
    return await getSignedUrl(client, command, { expiresIn: FIVE_MINUTES });
  },

  async deleteObject(bucket: string, key: string) {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    return await client.send(command);
  },
};
