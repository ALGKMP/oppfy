// src/trpc/postRouter.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import ZodSchemas from "../validation";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import Services from "../service";

export const postRouter = createTRPCRouter({
  createPresignedUrlForPost: protectedProcedure
    .input(ZodSchemas.post.createPresignedUrl)
    .output(z.string())
    .mutation(async ({ ctx, input }) => {
      const bucket = "awsstack-postbucketf37978b4-nyf2h7ran1kr";
      const objectKey = `posts/${Date.now()}-${input.author}`;
      const metadata = {
        author: ctx.session.uid,
        friend: input.friend,
        caption: input.caption
      }
      try {
        return await Services.aws.putObjectPresignedUrlWithMetadata(bucket, objectKey, input.contentLength, input.contentType, metadata);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create presigned URL"
        });
      }
    }),

  uploadPost: publicProcedure
    .meta({ openapi: { method: "POST", path: "/uploadPost" } })
    .input(ZodSchemas.post.uploadPost)
    .output(z.void())
    .mutation(async ({ input }) => {
      try {
        const postId = await Services.post.createPost(input.userId, input.friend, input.caption, input.key);
        return { success: true, postId };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post"
        });
      }
    }),

  editPost: protectedProcedure
    .input(ZodSchemas.post.updatePost)
    .mutation(async ({ input }) => {
      try {
        await Services.post.editPost(input.key, input.caption);
        return { success: true, message: "Post updated successfully" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update post"
        });
      }
    }),

  deletePost: protectedProcedure
    .input(ZodSchemas.post.deletePost)
    .mutation(async ({ input }) => {
      try {
        await Services.post.deletePost(input.key);
        return { success: true, message: "Post deleted successfully" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete post"
        });
      }
    }),

  getBatchPosts: protectedProcedure
    .input(ZodSchemas.post.getBatchPost)
    .query(async ({ input }) => {
      try {
        return await Services.post.getBatchPosts(input.keys);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get batch posts"
        });
      }
    }),
});

export default postRouter;
