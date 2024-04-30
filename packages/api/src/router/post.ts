// src/trpc/postRouter.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { trpcValidators } from "@acme/validators";

import Services from "../services";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  createPresignedUrlForPost: protectedProcedure
    .input(trpcValidators.post.createPresignedUrl)
    .output(z.string())
    .mutation(async ({ ctx, input }) => {
      const bucket = process.env.S3_BUCKET_NAME!;
      // const objectKey = `posts/${Date.now()}-postedBy:${ctx.session.uid}`;
      const objectKey = "posts/test2";
      const metadata = {
        author: ctx.session.uid,
        friend: input.friend,
        caption: input.caption,
      };
      try {
        return await Services.aws.putObjectPresignedUrlWithMetadata(
          bucket,
          objectKey,
          input.contentLength,
          input.contentType,
          metadata,
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create presigned URL",
        });
      }
    }),

  uploadPost: publicProcedure
    .meta({ openapi: { method: "POST", path: "/uploadPost" } })
    .input(trpcValidators.post.uploadPost)
    .output(z.void())
    .mutation(async ({ input }) => {
      try {
        console.log("here");
        await Services.post.createPost(
          input.author,
          input.friend,
          input.caption,
          input.key,
        );
        return;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
        });
      }
    }),

  editPost: protectedProcedure
    .input(trpcValidators.post.updatePost)
    .mutation(async ({ input }) => {
      try {
        await Services.post.editPost(input.postId, input.caption);
        return { success: true, message: "Post updated successfully" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update post",
        });
      }
    }),

  deletePost: protectedProcedure
    .input(trpcValidators.post.deletePost)
    .mutation(async ({ input }) => {
      try {
        await Services.post.deletePost(input.postId);
        return { success: true, message: "Post deleted successfully" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete post",
        });
      }
    }),

  batchPosts: protectedProcedure
    .input(trpcValidators.post.getBatchPost)
    .query(async ({ input }) => {
      try {
        return await Services.post.getPostsBatch(input.postIds);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get batch posts",
        });
      }
    }),

  allUserPosts: protectedProcedure.query(async ({ ctx }) => {
    try {
      await Services.post.getUserPosts(ctx.session.uid);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get all profile posts",
      });
    }
  }),

  allOtherUserPosts: protectedProcedure
    .input(trpcValidators.post.getUserPosts)
    .query(async ({ input }) => {
      try {
        await Services.post.getUserPosts(input.userId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get all profile posts",
        });
      }
    }),
});

export default postRouter;
