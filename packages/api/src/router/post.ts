import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

      const stats = await ctx.db.insert(schema.postStats).values({
        post: post[0].insertId
      });

      if (!stats)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post stats",
        });

      return;
    }),
    deletePost: protectedProcedure // Using protectedProcedure to ensure that the caller is authenticated
    .input(
      z.object({
        objectKey: z.string(), // The unique key of the object/post to be deleted
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate that the post exists and that the requester is authorized to delete it
      const post = await ctx.db.query.post.findFirst({
        where: eq(schema.post.key, input.objectKey),
      });
      if (!post)
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      
      // Example authorization check (adjust according to your auth logic)
      if (post.author !== ctx.session.userId && !ctx.session.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized to delete this post" });
      }

      // Delete the post from the database
      await ctx.db.delete(schema.post).where(eq(schema.post.key, input.objectKey));

      // Delete the object from S3
      const deleteObjectParams = {
        Bucket: "awsstack-postbucketf37978b4-nyf2h7ran1kr",
        Key: input.objectKey,
      };
      const command = new DeleteObjectCommand(deleteObjectParams);
      await ctx.s3.send(command);

      // Optionally, return some information or confirmation
      return { success: true, message: "Post deleted successfully" };
    }),

});
