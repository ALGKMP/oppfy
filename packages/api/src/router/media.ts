/*
    This router will populate anything related to media (images, videos, etc.).
    These will later be abstracted into separate routers to make calling them easier and more intuitive.
*/

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const mediaRouter = createTRPCRouter({
  /*
   *    @param {string} bucket - bucket in S3 for the image to be uploaded to.
   *   The `uploadImage` function is a protected procedure that accepts a string input parameter called
   *   `bucket`. It is a mutation, which means it will modify data on the server.
   */

  uploadImage: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: bucket }) => {
      const putObjectParams = {
        Bucket: bucket,
        Key: ctx.session.uid,
      };
      return await getSignedUrl(ctx.s3, new PutObjectCommand(putObjectParams), {
        expiresIn: 3600,
      });

      // TODO: for OpenAPI
      const prismaFindUniqueInput: Prisma.ProfilePhotoFindUniqueArgs = {
        where: { userId: ctx.session.uid },
      };

      const prismaResponse = await ctx.prisma.profilePhoto.findUnique(
        prismaFindUniqueInput,
      );

      if (!prismaResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error finding profile photo in DB",
          cause: prismaResponse,
        });
      }
    }),

  /*
   *    @param {string} key - key of the image to be retrieved from S3.
   *    @param {string} bucket - bucket in S3 for the image to be retrieved from.
   *    The `deleteImage` function is a protected procedure that accepts an input object with two
   *    properties: `key` and `bucket`. It is a mutation, which means it will modify data on the server.
   */
  deleteImage: protectedProcedure
    .input(z.object({ key: z.string(), bucket: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { key, bucket } = input;
      const deleteObjectParams = {
        Bucket: key,
        Key: bucket,
      };

      const s3Response = await ctx.s3.send(
        new DeleteObjectCommand(deleteObjectParams),
      );

      if (!s3Response.DeleteMarker) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting file from S3.",
          cause: s3Response,
        });
      }

      const prismaDeleteInput: Prisma.MediaDeleteArgs = {
        where: { id: ctx.session.uid },
      };

      const prismaResponse = await ctx.prisma.media.delete(prismaDeleteInput);

      if (!prismaResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting file from DB.",
          cause: prismaResponse,
        });
      }
    }),

  /*
   *    @param {string} key - key of the image in S3 to be retrieved.
   *    @param {string} bucket - bucket in S3 from which the image will be retrieved.
   *    The `getImage` function is a protected procedure that accepts an input object with two properties:
   *    `key` and `bucket`. It is a query, which means it will fetch data without modifying anything on the server.
   */
  getImage: protectedProcedure
    .input(z.object({ key: z.string(), bucket: z.string() }))
    .query(async ({ ctx, input }) => {
      const { key, bucket } = input;
      const getObjectParams = {
        Bucket: bucket,
        Key: key,
      };
      // Generate a pre-signed URL to retrieve the image from S3
      return await getSignedUrl(
        ctx.s3Client,
        new GetObjectCommand(getObjectParams),
        {
          expiresIn: 3600,
        },
      );
    }),

  /*
   *    @param {string} key - key of the image in S3 to be updated.
   *    @param {string} bucket - bucket in S3 where the image is stored.
   *    The `updateImage` function is a protected procedure that checks if an image exists in S3 and, if it does,
   *    generates a pre-signed URL for replacing that image and updates its associated database record.
   */
  updateImage: protectedProcedure
    .input(z.object({ key: z.string(), bucket: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { key, bucket } = input;
      const headObjectParams = {
        Bucket: bucket,
        Key: key,
      };
      // Check if the image exists in S3
      const exists = await ctx.s3.send(new HeadObjectCommand(headObjectParams));
      if (!exists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File does not exist in Bucket",
        });
      }

      // Generate a pre-signed URL to update the image in S3
      const signedUrl = await getSignedUrl(
        ctx.s3,
        new PutObjectCommand(headObjectParams),
        {
          expiresIn: 3600,
        },
      );

      // Update the lastUpdated timestamp for the image record in the database
      const prismaUpdateInput: Prisma.MediaUpdateArgs = {
        where: { id: ctx.session.uid },
        data: { lastUpdated: new Date() },
      };
      const prismaResponse = await ctx.prisma.media.update(prismaUpdateInput);
      if (!prismaResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating file in DB.",
          cause: prismaResponse,
        });
      }

      return signedUrl;
    }),
});
