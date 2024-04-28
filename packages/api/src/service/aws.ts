// src/utilities/AWSS3Service.ts
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server"; // Import if error handling needs to propagate in an API context

import { s3 } from "@acme/db";

import { metadataSchema, PutObjectMetadata } from "../validation/utils";

const AWSS3Service = {
  // TODO: Make Lambda function triggered on upload that optimize image size and format.
  putObjectPresignedUrl: async (
    bucket: string,
    key: string,
    contentLength: number,
    contentType: string,
  ): Promise<string> => {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
      });
      return await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    } catch (error) {
      console.error("Error creating presigned URL without metadata:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create presigned URL without metadata",
      });
    }
  },

  putObjectPresignedUrlWithMetadata: async (
    bucket: string,
    key: string,
    contentLength: number,
    contentType: string,
    metadata: PutObjectMetadata,
  ): Promise<string> => {
    try {
      const validatedMetadata = metadataSchema.parse(metadata);
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
        Metadata: validatedMetadata,
      });
      return await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    } catch (error) {
      console.error("Error creating presigned URL with metadata:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create presigned URL with metadata",
      });
    }
  },

  objectPresignedUrl: async (bucket: string, key: string): Promise<string> => {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    } catch (error) {
      console.error("Error creating object presigned URL:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create object presigned URL",
      });
    }
  },

  deleteObject: async (bucket: string, key: string) => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return await s3.send(command);
    } catch (error) {
      console.error("Error deleting object from S3:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete object from S3",
      });
    }
  },
};

export default AWSS3Service;
