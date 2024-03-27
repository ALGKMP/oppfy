/*
    This router will populate anything related to media (images, videos, etc.).
    These will later be abstracted into separate routers to make calling them easier and more intuitive.
*/

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const mediaRouter = createTRPCRouter({
  /*
   *    @param {string} bucket - bucket in S3 for the image to be uploaded to.
   *   The `uploadImage` function is a protected procedure that accepts a string input parameter called
   *   `bucket`. It is a mutation, which means it will modify data on the server.
   */

  createPresignedUrlWithClient: protectedProcedure
    .input(
      z.object({
        uid: z.string(),
        contentLength: z.number(),
        contentType: z.string(),
        caption: z.string().optional(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const key = "test123";
      const bucket = "awsstack-mybucket26e0c3623-9hdtd89r850k";

      const metadata = {
        authorId: input.uid,
        ...(input.caption && { caption: input.caption }),
        ...(input.tags && { tags: input.tags.join(", ") }),
      };

      const putObjectParams = {
        Bucket: bucket,
        Key: key,
        Metadata: metadata,
        Fields: {
          "Content-Length": input.contentLength, // Content-Length is to ensure we get the file we expected from the frontend
          "Content-Type": input.contentType, // Content-Type is to ensure we get the file we expected from the frontend
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

  uploadMetadata: publicProcedure
    .meta({ /* 👉 */ openapi: { method: "POST", path: "/uploadMetadata" } })
    .input(
      z.object({
        metadata: z.object({
          authorid: z.string().optional(),
          caption: z.string().optional(),
          tags: z.string().optional(),
        }).optional(),
      }),
    )
    .output(z.object({ greeting: z.string() }))
    .mutation(({ input }) => {
      if (input.metadata){
        console.log(`metadata: ${input.metadata.authorid}, ${input.metadata.caption}, ${input.metadata.tags}`)
        return { greeting: `Hello ${input.metadata.authorid}!` };
      }
      return {greeting: 'no metadata'}
    }),
});
