// src/utilities/AWSS3Service.ts
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

import { s3 } from "@acme/db";
import { trpcValidators } from "@acme/validators";

const AWSS3Service = {
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
      throw new Error("Failed to create presigned URL without metadata");
    }
  },

  putObjectPresignedUrlWithMetadataPost: async (
    bucket: string,
    objectKey: string,
    contentLength: number,
    contentType: string,
    metadata: z.infer<typeof trpcValidators.post.metadata>,
  ): Promise<string> => {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Metadata: metadata,
        ContentType: contentType,
        ContentLength: contentLength,
      });
      return await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    } catch (error) {
      console.error("Error creating presigned URL with metadata:", error);
      throw new Error("Failed to create presigned URL with metadata");
    }
  },

  putObjectPresignedUrlWithMetadataProfilePicture: async (
    bucket: string,
    objectKey: string,
    contentLength: number,
    contentType: string,
    metadata: z.infer<typeof trpcValidators.post.profilePictureMetadata>,
  ): Promise<string> => {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Metadata: metadata,
        ContentType: contentType,
        ContentLength: contentLength,
      });
      return await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    } catch (error) {
      console.error("Error creating presigned URL with metadata:", error);
      throw new Error("Failed to create presigned URL with metadata");
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
      throw new Error("Failed to create object presigned URL");
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
      throw new Error("Failed to delete object from S3");
    }
  },
};

export default AWSS3Service;
