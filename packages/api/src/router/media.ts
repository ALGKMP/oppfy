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

import { camelToKebab, Metadata } from "@acme/lambda";

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
        uid: z.string(),
        contentLength: z.number(),
        contentType: z.string(),
        caption: z.string().optional(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const metadata = {
        authorId: input.uid,
        ...(input.caption && { caption: input.caption }),
        ...(input.tags && { tags: input.tags.join(",") }),
      };

      // for (const key in metadata) {
      //   metadata[camelToKebab(key)] = metadata[key];
      // }

      const putObjectParams = {
        Bucket: input.bucket,
        Key: input.key,
        Metadata: metadata,
        Fields: {
          "Content-Length": input.contentLength,
          // "Content-Type": input.contentType,
          // "x-amz-meta-authorid": input.uid,
          // "x-amz-meta-caption": input.caption,
          // "x-amz-meta-tags": input.tags.join(","),
        },
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
  lambdaHitThis: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/lambdaHitThis",
        contentTypes: ["application/json", "text/plain"],
      },
    })
    .input(
      z.object({
        authorId: z.string(),
        caption: z.string(),
        tags: z.array(z.string()),
        objectKey: z.string(),
      }),
    )
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      console.log("HITTING LAMDAENPOINT");
      const { authorId, caption, tags, objectKey } = input;

      // TODO what should we do for ID's
      const postId = Math.floor(Math.random() * 1000000).toString();

      const prismaPostCreateInput: Prisma.PostCreateArgs = {
        data: {
          id: postId,
          caption: caption,
          datePosted: new Date(),
          author: {
            connect: {
              id: authorId,
            },
          },
          tags: {
            create: tags.map((tag) => {
              return {
                postId: postId,
                userId: tag,
              };
            }),
          },
          media: {
            create: {
              objectKey: objectKey,
              lastUpdated: new Date(),
              type: MediaTypes.PHOTO,
            },
          },
          postStats: {
            create: {
              views: 0,
              likeCount: 0,
            },
          },
        },
      };

      const prismaResponse = await ctx.prisma.post.create(
        prismaPostCreateInput,
      );
      console.log(`Created Prisma Post : ${prismaResponse.id}`);
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
      const prismaCreateInput: Prisma.MediaCreateArgs = {
        data: {
          objectKey: key,
          lastUpdated: new Date(),
          type: MediaTypes.PHOTO,
        },
      };

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
        await ctx.prisma.media.create(prismaCreateInput);

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
  getImageV1: protectedProcedure
    .input(z.object({ key: z.string(), bucket: z.string() }))
    .query(async ({ ctx, input }) => {
      const { key, bucket } = input;
      const getObjectParams = {
        Bucket: bucket,
        Key: key,
      };
      const prismaDeleteInput: Prisma.MediaDeleteArgs = {
        where: { objectKey: key },
      };
      // Generate a pre-signed URL to retrieve the image from S3
      const s3Response = await getSignedUrl(
        ctx.s3,
        new GetObjectCommand(getObjectParams),
        {
          expiresIn: 3600,
        },
      );
      if (!s3Response) {
        // Delete the record from the database if the file was not found in S3
        await ctx.prisma.media.delete(prismaDeleteInput);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error retrieving file from S3.",
          cause: s3Response,
        });
      }
    }),

  getImageV2: protectedProcedure
    .input(z.object({ postId: z.string(), bucket: z.string() }))
    .query(async ({ ctx, input }) => {
      const { postId, bucket } = input;

      const prismaPostFindUniqueInput: Prisma.PostFindUniqueArgs = {
        where: { id: postId },
        include: { media: true },
      };
      const prismaPostResponse = await ctx.prisma.post.findUnique(
        prismaPostFindUniqueInput,
      );
      if (!prismaPostResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error retrieving file from DB.",
          cause: prismaPostResponse,
        });
      }

      const prismaMediaFindUniqueInput: Prisma.MediaFindUniqueArgs = {
        where: { id: prismaPostResponse.mediaId },
      };
      const prismaMediaResponse = await ctx.prisma.media.findUnique(
        prismaMediaFindUniqueInput,
      );
      if (!prismaMediaResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error retrieving file from DB.",
          cause: prismaMediaResponse,
        });
      }

      const key = prismaMediaResponse.objectKey;
      const getObjectParams = {
        Bucket: bucket,
        Key: key,
      };
      const prismaDeleteInput: Prisma.MediaDeleteArgs = {
        where: { objectKey: key },
      };

      // Generate a pre-signed URL to retrieve the image from S3
      const s3Response = await getSignedUrl(
        ctx.s3,
        new GetObjectCommand(getObjectParams),
        {
          expiresIn: 3600,
        },
      );
      if (!s3Response) {
        // Delete the record from the database if the file was not found in S3
        await ctx.prisma.media.delete(prismaDeleteInput);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error retrieving file from S3.",
          cause: s3Response,
        });
      }
    }),
});
