import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { postContentType } from "../../../../validators/src/shared/media";
import { DomainError, ErrorCode } from "../../errors";
import { PendingUserService } from "../../services/user/pendingUser";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

export const postRouter = createTRPCRouter({
  uploadPicturePostForUserOnApp: protectedProcedure
    .input(
      z.object({
        recipient: z.string(),
        caption: z.string().max(255).default(""),
        height: z.string(),
        width: z.string(),
        contentLength: z.number(),
        contentType: postContentType,
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
        contentType: postContentType,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // do pending user stuff here
        const pendingUserRecord =
          await ctx.services.pendingUser.createOrGetPendingUser({
            phoneNumber: input.number,
          });

        return await ctx.services.s3.uploadPostForUserNotOnAppUrl({
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

  uploadVideoPostForUserOnApp: protectedProcedure
    .input(
      z.object({
        recipient: z.string(),
        caption: z.string().max(255).default(""),
        height: z.string(),
        width: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { url } = await ctx.services.mux.PresignedUrlWithPostMetadata({
          ...input,
          author: ctx.session.uid,
          type: "onApp",
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

  uploadVideoPostForUserNotOnApp: protectedProcedure
    .input(
      z.object({
        number: z.string(),
        caption: z.string().max(255).default(""),
        height: z.string(),
        width: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // do pending user stuff here

        const { url } = await ctx.services.mux.PresignedUrlWithPostMetadata({
          ...input,
          author: ctx.session.uid,
          type: "notOnApp",
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

  getPostForNextJs: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.post.getPostForNextJs(input.postId);
      } catch (err) {
        if (err instanceof DomainError) {
          if (err.code === ErrorCode.UNAUTHORIZED) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: err.message,
            });
          }
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get post with ID ${input.postId}. The post may not exist or the database could be unreachable.`,
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
        pageSize: z.number().nonnegative().optional().default(10),
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
        pageSize: z.number().nonnegative().optional().default(10),
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
            type: z.enum(["following", "recommended"]),
            createdAt: z.date(),
            postId: z.string(),
          })
          .optional(),
        pageSize: z.number().nonnegative().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.post.paginatePostsForFeed(
          ctx.session.uid,
          input.cursor ?? null,
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
        pageSize: z.number().nonnegative().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginatePostsOfUserOther({
          userId: input.userId,
          cursor: input.cursor ?? null,
          pageSize: input.pageSize,
          currentUserId: ctx.session.uid,
        });

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
        pageSize: z.number().nonnegative().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginatePostsOfUserSelf(
          ctx.session.uid,
          input.cursor ?? null,
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
        pageSize: z.number().nonnegative().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.post.paginatePostsOfUserOther({
          userId: input.userId,
          cursor: input.cursor ?? null,
          pageSize: input.pageSize ?? 10,
          currentUserId: ctx.session.uid,
        });
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
        return await ctx.services.post.getPost(input.postId, ctx.session.uid);
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
      const userId = ctx.session.uid;
      const { commentId, postId } = input;

      try {
        await ctx.services.post.deleteComment({ userId, commentId, postId });
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
