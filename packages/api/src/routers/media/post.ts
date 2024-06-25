import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@oppfy/validators";

import { DomainError } from "../../errors";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const postRouter = createTRPCRouter({
  createPresignedUrlForPost: protectedProcedure
    .input(trpcValidators.input.post.createS3PresignedUrl)
    .output(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentDate = Date.now();
        const bucket = process.env.S3_POST_BUCKET!;
        const objectKey = `posts/${currentDate}-${ctx.session.uid}`;
        const metadata = sharedValidators.media.postMetadataForS3.parse({
          author: ctx.session.uid,
          recipient: input.recipientId,
          caption: input.caption,
          width: input.width.toString(), // S3 Metadata have to be strings or some bullshit
          height: input.height.toString(), // S3 Metadata have to be strings or some bullshit
        });

        return await ctx.services.s3.putObjectPresignedUrlWithPostMetadata({
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
    .input(trpcValidators.input.post.createMuxPresignedUrl)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.mux.createDirectUpload(
          ctx.session.uid,
          input.recipientId,
          input.caption,
        );
        return result.url;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to create presigned URL for video upload. Please check your network connection and try again.",
        });
      }
    }),

  editPost: protectedProcedure
    .input(trpcValidators.input.post.updatePost)
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
    .input(trpcValidators.input.post.deletePost)
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

  paginatePostsOfUserSelf: protectedProcedure
    .input(trpcValidators.input.post.paginatePostsOfUserSelf)
    .output(trpcValidators.output.post.paginatedPosts)
    .query(async ({ ctx, input }) => {
      try {
        console.log("TRPC getPosts input: ", input);
        const result = await ctx.services.post.paginatePostsOfUserSelf(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        console.log("TRPC getPosts result before validation: ", result);
        const parsedResult =
          trpcValidators.output.post.paginatedPosts.parse(result);
        console.log("TRPC getPosts result after validation: ", parsedResult);
        return parsedResult;
      } catch (err) {
        console.error("TRPC getPosts error: ", err);
        if (err instanceof DomainError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to paginate posts.",
        });
      }
    }),

  paginatePostsOfUserOther: protectedProcedure
    .input(trpcValidators.input.post.paginatePostsOfUserOther)
    .output(trpcValidators.output.post.paginatedPosts)
    .query(async ({ ctx, input }) => {
      try {
        console.log("TRPC getPosts input: ", input);
        const result = await ctx.services.post.paginatePostsOfUserOther(
          input.profileId,
          input.cursor,
          input.pageSize,
        );
        console.log("TRPC getPosts result before validation: ", result);
        const parsedResult =
          trpcValidators.output.post.paginatedPosts.parse(result);
        console.log("TRPC getPosts result after validation: ", parsedResult);
        return parsedResult;
      } catch (err) {
        console.error("TRPC getPosts error: ", err);
        if (err instanceof DomainError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to paginate posts.",
        });
      }
    }),

  paginatePostsByUserSelf: protectedProcedure
    .input(trpcValidators.input.post.paginatePostsByUserSelf)
    .output(trpcValidators.output.post.paginatedPosts)
    .query(async ({ ctx, input }) => {
      try {
        console.log("TRPC getPosts input: ", input);
        const result = await ctx.services.post.paginatePostsOfUserSelf(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        console.log("TRPC getPosts result before validation: ", result);
        const parsedResult =
          trpcValidators.output.post.paginatedPosts.parse(result);
        console.log("TRPC getPosts result after validation: ", parsedResult);
        return parsedResult;
      } catch (err) {
        console.error("TRPC getPosts error: ", err);
        if (err instanceof DomainError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to paginate posts.",
        });
      }
    }),

  paginatePostsByUserOther: protectedProcedure
    .input(trpcValidators.input.post.paginatePostsByUserOther)
    .output(trpcValidators.output.post.paginatedPosts)
    .query(async ({ ctx, input }) => {
      try {
        console.log("TRPC getPosts input: ", input);
        const result = await ctx.services.post.paginatePostsOfUserOther(
          input.profileId,
          input.cursor,
          input.pageSize,
        );
        console.log("TRPC getPosts result before validation: ", result);
        const parsedResult =
          trpcValidators.output.post.paginatedPosts.parse(result);
        console.log("TRPC getPosts result after validation: ", parsedResult);
        return parsedResult;
      } catch (err) {
        console.error("TRPC getPosts error: ", err);
        if (err instanceof DomainError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to paginate posts.",
        });
      }
    }),

  likePost: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.post.likePost(ctx.session.uid, input.postId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to like post.",
        });
      }
    }),

  hasliked: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
      }),
    )
    .output(z.boolean())
    .query(async ({ ctx, input }) => {
      try {
        return !!(await ctx.services.post.getLike(ctx.session.uid, input.postId));
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check if user has liked post.",
        });
      }
    }),

  unlikePost: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.post.unlikePost(ctx.session.uid, input.postId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove like from post.",
        });
      }
    }),

  createComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        body: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.post.commentOnPost(
          ctx.session.uid,
          input.postId,
          input.body,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to comment on post.",
        });
      }
    }),

  deleteComment: protectedProcedure
    .input(
      z.object({
        commentId: z.number(),
        postId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.post.deleteComment(input.commentId, input.postId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete comment.",
        });
      }
    }),

  paginateComments: protectedProcedure
    .input(trpcValidators.input.post.paginateComments)
    .output(trpcValidators.output.post.paginatedComments)
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginateComments(
          input.postId,
          input.cursor,
          input.pageSize,
        );
        const parsedResult =
          trpcValidators.output.post.paginatedComments.parse(result);
        return parsedResult;
      } catch (err) {
        console.error("TRPC paginateComments error: ", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to paginate comments.",
        });
      }
    }),
});

export default postRouter;
