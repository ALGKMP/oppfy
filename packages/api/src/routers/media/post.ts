import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@oppfy/env";
import { sharedValidators, trpcValidators } from "@oppfy/validators";

import { DomainError } from "../../errors";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const postRouter = createTRPCRouter({
  createPresignedUrlForImagePost: protectedProcedure
    .input(trpcValidators.input.post.createPresignedUrlForImagePost)
    .output(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentDate = Date.now();
        const objectKey = `posts/${currentDate}-${ctx.session.uid}`;

        const { contentLength, contentType, ...metadata } = input;

        const presignedUrl =
          await ctx.services.s3.putObjectPresignedUrlWithPostMetadata({
            Bucket: env.S3_POST_BUCKET,
            Key: objectKey,
            ContentLength: contentLength,
            ContentType: contentType,
            Metadata: {
              ...metadata,
              author: ctx.session.uid,
            },
          });

        return presignedUrl;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create presigned URL for post upload.",
        });
      }
    }),

  createPresignedUrlForVideoPost: protectedProcedure
    .input(trpcValidators.input.post.createPresignedUrlForVideoPost)
    .mutation(async ({ ctx, input }) => {
      try {
        const { url } = await ctx.services.mux.PresignedUrlWithPostMetadata({
          author: ctx.session.uid,
          ...input,
        });

        return url;
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
        const result = await ctx.services.post.paginatePostsOfUserSelf(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        const parsedResult =
          trpcValidators.output.post.paginatedPosts.parse(result);
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

  paginatePostsOfFollowing: protectedProcedure
    .input(trpcValidators.input.post.paginatePostsOfFollowing)
    .output(trpcValidators.output.post.paginatedPosts)
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginatePostsOfFollowing(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        const parsedResult =
          trpcValidators.output.post.paginatedPosts.parse(result);
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

  paginatePostsOfRecommended: protectedProcedure
    .input(trpcValidators.input.post.paginatePostsOfRecommended)
    .output(trpcValidators.output.post.paginatedPosts)
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginatePostsOfRecommended(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        const parsedResult =
          trpcValidators.output.post.paginatedPosts.parse(result);
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

  paginatePostsForFeed: protectedProcedure
    .input(trpcValidators.input.post.paginatePostsForFeed)
    .output(trpcValidators.output.post.paginatedFeedPosts)
    .query(async ({ ctx, input }) => {
      try {
        console.log("TRPC getPosts input: ", input);
        const result = await ctx.services.post.paginatePostsOfFollowing(
          ctx.session.uid,
          input.cursor?.followingCursor,
          input.pageSize,
        );

        const parsedFollowingResult =
          trpcValidators.output.post.paginatedFeedPosts.parse(result);

        if (parsedFollowingResult.items.length < input.pageSize!) {
          const result = await ctx.services.post.paginatePostsOfRecommended(
            ctx.session.uid,
            input.cursor?.recomendedCursor,
            input.pageSize! - parsedFollowingResult.items.length,
          );

          const parsedRecommendedResult =
            trpcValidators.output.post.paginatedFeedPosts.parse(result);

          parsedRecommendedResult.items = [
            ...parsedFollowingResult.items,
            ...parsedRecommendedResult.items,
          ];

          return parsedRecommendedResult;
        }

        return parsedFollowingResult;
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

  getPost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .output(sharedValidators.media.post)
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.post.getPost(input.postId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get post with ID ${input.postId}. The post may not exist or the database could be unreachable.`,
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
        return !!(await ctx.services.post.getLike(
          ctx.session.uid,
          input.postId,
        ));
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
