import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { eq, schema } from "@acme/db";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  createPresignedUrlForPost: protectedProcedure
    .input(
      z
        .object({
          author: z.string(),
          recipient: z.string(),
          caption: z.string(),
          contentLength: z.number(),
          contentType: z.string(),
        })
        .refine(
          (data) =>
            ["image/jpeg", "image/png", "image/gif", "image"].includes(
              data.contentType,
            ),
          {
            // Validates file type
            message: "Invalid file type",
          },
        ),
    )
    .output(z.string())
    .mutation(async ({ ctx, input }) => {
      const s3Client = ctx.s3;
      const bucketName = "awsstack-postbucketf37978b4-nyf2h7ran1kr";
      const objectKey = `posts/${Date.now()}-${input.author}`;

      const metadata = {
        author: input.author,
        recipient: input.recipient,
        caption: input.caption,
      };

      const putObjectParams = {
        Bucket: bucketName,
        Key: objectKey,
        Metadata: metadata,
        Fields: {
          "Content-Length": input.contentLength,
          "Content-Type": input.contentType,
        },      
      };

      const command = new PutObjectCommand(putObjectParams);
      
      const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL expires in 1 hour

      return url;
    }),
  uploadPost: publicProcedure
    .meta({ openapi: { method: "POST", path: "/uploadPost" } })
    .input(
      z.object({
        author: z.string(),
        recipient: z.string(),
        caption: z.string(),
        objectKey: z.string(),
      }),
    ).output(z.void())
    .mutation(async ({ ctx, input }) => {
      // Validate the author and recipient exist
      const authorExists = await ctx.db.query.user.findFirst({
        where: eq(schema.user.id, input.author),
      });
      if (!authorExists)
        throw new TRPCError({ code: "NOT_FOUND", message: "Author not found" });

      const recipientExists = await ctx.db.query.user.findFirst({
        where: eq(schema.user.id, input.recipient),
      });
      if (!recipientExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipient not found",
        });

      // Insert the post into the database
      const post = await ctx.db.insert(schema.post).values({
        author: input.author,
        recipient: input.recipient,
        caption: input.caption,
        key: input.objectKey, // Assuming your post table has a field for this
        // Add other fields as necessary
      });

      if (!post)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
        });

      return;
    }),
});
