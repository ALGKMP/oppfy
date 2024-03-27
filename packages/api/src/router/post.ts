import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  createPresignedUrlForPost: protectedProcedure
    .input(
      z.object({
        authorId: z.string(),
        recipientProfileId: z.string(),
        title: z.string(),
        body: z.string(),
        // Optionally include other fields as necessary
      })
    )
    .mutation(async ({ ctx, input }) => {
      const s3Client = new S3Client({ region: "us-east-1" });
      const bucketName = "awsstack-profilebucket3c1f9a36-udj4vt6odzg7";
      const objectKey = `posts/${Date.now()}-${input.authorId}`;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: 'binary/octet-stream', // or as per your requirement
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

      return { presignedUrl: url, objectKey };
    }),
    finalizePostUpload: publicProcedure
    .meta({ openapi: { method: "POST", path: "/finalizePostUpload" } })
    .input(
      z.object({
        authorId: z.string(),
        recipientProfileId: z.string(),
        title: z.string(),
        body: z.string(),
        mediaKey: z.string(), // The S3 object key from the presigned URL upload
        // Optionally include other fields as necessary
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate the author and recipient exist
      const authorExists = await ctx.db.query.profile.findFirst({
        where: { id: input.authorId },
      });
      if (!authorExists) throw new TRPCError({ code: 'NOT_FOUND', message: 'Author profile not found' });

      const recipientExists = await ctx.db.profile.findUnique({
        where: { id: input.recipientProfileId },
      });
      if (!recipientExists) throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipient profile not found' });

      // Insert the post into the database
      const post = await ctx.db.post.create({
        data: {
          authorId: input.authorId,
          recipientProfileId: input.recipientProfileId,
          title: input.title,
          body: input.body,
          mediaKey: input.mediaKey, // Assuming your post table has a field for this
          // Add other fields as necessary
        },
      });

      if (!post) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create post' });

      return { success: true, postId: post.id };
    }),
});
});
