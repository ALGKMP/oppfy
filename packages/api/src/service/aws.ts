// src/utilities/AWSS3Service.ts
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3 } from "@acme/db";
import { PutObjectMetadata, metadataSchema } from "../validation/utils";

const AWSS3Service = {
  // TODO: Make Lambda function triggered on upload that optimize image size and format.
  putObjectPresignedUrl: async (
    bucket: string,
    key: string,
    contentLength: number,
    contentType: string,
  ): Promise<string> => {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });
    return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
  },

  putObjectPresignedUrlWithMetadata: async (
    bucket: string,
    key: string,
    contentLength: number,
    contentType: string,
    metadata: PutObjectMetadata,
  ): Promise<string> => {
    const validatedMetadata = metadataSchema.parse(metadata);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
      Metadata: validatedMetadata,
    });

    return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
  },

  objectPresignedUrl: async (bucket: string, key: string): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
  },

  deleteObject: async (bucket: string, key: string) => {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3.send(command);
    console.log(response);
  },
};
export default AWSS3Service;
