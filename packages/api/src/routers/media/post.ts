import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { DomainError } from "../../errors";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const postRouter = createTRPCRouter({
  uploadPicturePostForUserOnApp: protectedProcedure
    .input(
      z.object({
        recipient: z.string(),
        caption: z.string().max(255).default(""),
        height: z.string(),
        width: z.string(),
        contentLength: z.number(),
        contentType: z.enum(["image/jpeg", "image/png"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.services.s3.uploadPostForUserOnAppUrl({
          author: ctx.session.uid,
          ...input,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve presigned URL for post upload.",
        });
      }
    }),

  uploadPicturePostForUserNotOnApp: protectedProcedure
    .input(
      z.object({
        number: z.string(),
        caption: z.string().max(255).default(""),
        height: z.string(),
        width: z.string(),
        contentLength: z.number(),
        contentType: z.enum(["image/jpeg", "image/png"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.s3.uploadPostForUserNotOnAppUrl({
          author: ctx.session.uid,
          ...input,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve presigned URL for post upload.",
        });
      }
    }),

  editPost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        caption: z.string().max(255).default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId, caption } = input;
      try {
        await ctx.services.post.editPost({ postId, caption });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to edit post with ID ${input.postId}. The post may not exist or the database could be unreachable.`,
        });
      }
    }),

  deletePost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
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
    .input(
      z.object({
        cursor: z
          .object({
            postId: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().nonnegative().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.post.paginatePostsOfUserSelf(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
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
    .input(
      z.object({
        cursor: z
          .object({
            postId: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().nonnegative().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.post.paginatePostsOfRecommended(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
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
    .input(
      z.object({
        cursor: z
          .object({
            doneFollowing: z.boolean(),
            followingCursor: z
              .object({
                createdAt: z.date(),
                followerId: z.string(),
              })
              .optional(),
            recomendedCursor: z
              .object({
                createdAt: z.date(),
                postId: z.string(),
              })
              .optional(),
          })
          .optional(),

        pageSize: z.number().nonnegative().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.post.paginatePostsForFeed(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
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
    .input(
      z.object({
        userId: z.string(),
        cursor: z
          .object({
            postId: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().nonnegative().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginatePostsOfUserOther(
          input.userId,
          input.cursor,
          input.pageSize,
        );

        return result;
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
    .input(
      z.object({
        cursor: z
          .object({
            postId: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().nonnegative().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginatePostsOfUserSelf(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        return result;
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
    .input(
      z.object({
        userId: z.string(),
        cursor: z
          .object({
            postId: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().nonnegative().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginatePostsOfUserOther(
          input.userId,
          input.cursor,
          input.pageSize,
        );
        return result;
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
    .input(z.object({ postId: z.string() }))
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
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      try {
        await ctx.services.post.likePost({ userId: ctx.session.uid, postId });
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
        postId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { postId } = input;
      try {
        return !!(await ctx.services.post.getLike({
          userId: ctx.session.uid,
          postId,
        }));
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
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      try {
        await ctx.services.post.unlikePost({ userId: ctx.session.uid, postId });
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
        postId: z.string(),
        body: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId, body } = input;
      try {
        await ctx.services.post.commentOnPost({
          userId: ctx.session.uid,
          postId,
          body,
        });
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
        commentId: z.string(),
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { commentId, postId } = input;

      try {
        await ctx.services.post.deleteComment({ commentId, postId });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete comment.",
        });
      }
    }),

  paginateComments: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        cursor: z
          .object({
            commentId: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().nonnegative().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginateComments(
          input.postId,
          input.cursor,
          input.pageSize,
        );
        return result;
      } catch (err) {
        console.error("TRPC paginateComments error: ", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to paginate comments.",
        });
      }
    }),

  viewPost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.post.viewPost({
          userId: ctx.session.uid,
          postId: input.postId,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to view post for ${input.postId}`,
        });
      }
    }),

  viewMultiplePosts: protectedProcedure
    .input(z.object({ postIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.post.viewMultiplePosts({
          userId: ctx.session.uid,
          postIds: input.postIds,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to view multiple posts for ${input.postIds}`,
        });
      }
    }),
});

export default postRouter;
