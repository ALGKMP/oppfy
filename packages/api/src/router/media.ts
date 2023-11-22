/*
    This router will populate anything related to media (images, videos, etc.).
    These will later be abstracted into separate routers to make calling them easier and more intuitive.
*/

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Prisma } from "@prisma/client";
import { MediaTypes } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Metadata } from "@acme/lambda";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// interface Metadata1 {
//   [index: string]: string;
//   AuthorId: string;
// }
// interface Metadata2 {
//   [index: string]: string;
//   AuthorId: string;
//   Caption: string;
// }
// interface Metadata3 {
//   [index: string]: string;
//   AuthorId: string;
//   Caption: string;
//   Tags: string;
// }
// type Metadata = Metadata1 | Metadata2 | Metadata3;

export const mediaRouter = createTRPCRouter({
  /*
   *    @param {string} bucket - bucket in S3 for the image to be uploaded to.
   *   The `uploadImage` function is a protected procedure that accepts a string input parameter called
   *   `bucket`. It is a mutation, which means it will modify data on the server.
   */

  createPresignedUrlWithClient: protectedProcedure
    .input(
      z.object({
        bucket: z.string(),
        key: z.string(),
        caption: z.string().optional(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const metadata: Metadata = {
        AuthorId: ctx.session.uid,
      };

      if (input.caption) {
        metadata.Caption = input.caption;
      }

      // if (input.tags) {
      //   metadata.Tags = input.tags;
      // }

      const putObjectParams = {
        Bucket: input.bucket,
        Key: input.key,
        Metadata: metadata,
      };

      const url = await getSignedUrl(
        ctx.s3,
        new PutObjectCommand(putObjectParams),
        {
          expiresIn: 3600,
        },
      );
      return url;
    }),

  /**
   * OpenAPI Endpoint
   */
  prismaCreate: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/aws-prisma-create",
        contentTypes: ["application/json", "text/plain"],
      },
    })
    .input(z.object({}))
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      console.log("input", input);
    }),

  postProfilePicture: protectedProcedure
    .input(z.object({ bucket: z.string(), key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const putObjectParams = {
        Bucket: input.bucket,
        Key: input.key,
        Metadata: {
          profile: "true",
        },
      };
      return await getSignedUrl(ctx.s3, new PutObjectCommand(putObjectParams), {
        expiresIn: 3600,
      });
    }),

  /*
   *    @param {string} key - key of the image to be retrieved from S3.
   *    @param {string} bucket - bucket in S3 for the image to be retrieved from.
   *    The `deleteImage` function is a protected procedure that accepts an input object with two
   *    properties: `key` and `bucket`. It is a mutation, which means it will modify data on the server.
   *    The procedure will delete the image from S3 and its associated record from the database.
   */
  deleteImage: protectedProcedure
    .input(z.object({ key: z.string(), bucket: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { key, bucket } = input;
      const deleteObjectParams = {
        Bucket: bucket,
        Key: key,
      };
      const prismaDeleteInput: Prisma.MediaDeleteArgs = {
        where: { objectKey: key },
      };
      const prismaFindUniqueInput: Prisma.MediaFindUniqueArgs = {
        where: { objectKey: key },
      };
      const prismaCreateInput: Prisma.MediaCreateArgs = {
        data: {
          objectKey: key,
          lastUpdated: new Date(),
          type: MediaTypes.PHOTO,
        },
      };

      const prismaCopy = await ctx.prisma.media.findUnique(
        prismaFindUniqueInput,
      );
      const prismaResponse = await ctx.prisma.media.delete(prismaDeleteInput);

      if (!prismaResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting file from DB.",
          cause: prismaResponse,
        });
      }

      const s3Response = await ctx.s3.send(
        new DeleteObjectCommand(deleteObjectParams),
      );

      if (!s3Response.DeleteMarker) {
        // If the file was successfully deleted from S3, but not from the database, re-create the database record
        ctx.prisma.media.create(prismaCreateInput);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting file from S3.",
          cause: s3Response,
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
    .input(z.object({ objectKey: z.string(), bucket: z.string() }))
    .query(async ({ ctx, input }) => {
      const { objectKey, bucket } = input;
      const getObjectParams = {
        Bucket: bucket,
        Key: objectKey,
      };
      // Generate a pre-signed URL to retrieve the image from S3
      return await getSignedUrl(ctx.s3, new GetObjectCommand(getObjectParams), {
        expiresIn: 3600,
      });
    }),
});
