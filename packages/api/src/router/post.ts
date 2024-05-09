import { z } from "zod";

import { trpcValidators } from "@acme/validators";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  createPresignedUrlForPost: protectedProcedure
    .input(trpcValidators.post.createPresignedUrl)
    .output(z.string())
    .mutation(async ({ ctx, input }) => {
      const currentDate = Date.now();

      const bucket = process.env.S3_POST_BUCKET!;
      const objectKey = `posts/${currentDate}-${ctx.session.uid}`;
      const metadata = {
        author: ctx.session.uid,
        friend: input.friend,
        caption: input.caption,
      };

      return await ctx.services.aws.putObjectPresignedUrlWithPostMetadata({
        Bucket: bucket,
        Key: objectKey,
        ContentType: input.contentType,
        ContentLength: input.contentLength,
        Metadata: metadata,
      });
    }),

  uploadPost: publicProcedure
    .meta({ openapi: { method: "POST", path: "/uploadPost" } })
    .input(trpcValidators.post.uploadPost)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      await ctx.services.post.createPost(
        input.author,
        input.friend,
        input.caption,
        input.key,
      );
    }),

  editPost: protectedProcedure
    .input(trpcValidators.post.updatePost)
    .mutation(async ({ ctx, input }) => {
      await ctx.services.post.editPost(input.postId, input.caption);
    }),

  deletePost: protectedProcedure
    .input(trpcValidators.post.deletePost)
    .mutation(async ({ ctx, input }) => {
      await ctx.services.post.deletePost(input.postId);
    }),

  getPosts: protectedProcedure
    .input(trpcValidators.post.getPosts)
    .query(async ({ ctx, input }) => {
      return await ctx.services.post.getPosts(
        ctx.session.uid,
        input.cursor,
        input.pageSize,
      );
    }),
});

export default postRouter;
