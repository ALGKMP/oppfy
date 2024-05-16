import { TRPCError } from "@trpc/server";
import { z } from "zod";
// import { Webhooks } from "@mux/mux-node/src/resources/webhooks.js";

import { trpcValidators } from "@acme/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  createPresignedUrlForPost: protectedProcedure
    .input(trpcValidators.post.createPresignedUrl)
    .output(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentDate = Date.now();
        const bucket = process.env.S3_POST_BUCKET!;
        const objectKey = `posts/${currentDate}-${ctx.session.uid}`;
        const metadata = {
          author: ctx.session.uid,
          recipient: input.recipient,
          caption: input.caption,
        };

        return await ctx.services.aws.putObjectPresignedUrlWithPostMetadata({
          Bucket: bucket,
          Key: objectKey,
          ContentLength: input.contentLength,
          ContentType: "image/jpeg",
          Metadata: metadata,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to create presigned URL for post upload. Please check your network connection and try again.",
        });
      }
    }),

    createMuxVideoPresignedUrl: protectedProcedure
    .mutation(async ({ ctx }) => {
      const result = await ctx.services.mux.createDirectUpload();
      return result.url;
    }),

  // muxWebhook: publicProcedure
  //   .meta({ /* 👉 */ openapi: { method: "POST", path: "/upload-video" } })
  //   // .input(z.any())
  //   .output(z.void())
  //   .mutation(({ input }) => {
  //     console.log("muxWebhook hit");
  //     console.log(input);
  //   }),

  editPost: protectedProcedure
    .input(trpcValidators.post.updatePost)
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.post.editPost(input.postId, input.caption);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to edit post with ID ${input.postId}. The post may not exist or the database could be unreachable.`,
        });
      }
    }),

  deletePost: protectedProcedure
    .input(trpcValidators.post.deletePost)
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.post.deletePost(input.postId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete post with ID ${input.postId}. Ensure the post exists and that you have the necessary permissions.`,
        });
      }
    }),

  getPosts: protectedProcedure
    .input(trpcValidators.post.getPosts)
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.post.getPosts(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error retrieving posts. Please try again later.",
        });
      }
    }),
});

export default postRouter;
