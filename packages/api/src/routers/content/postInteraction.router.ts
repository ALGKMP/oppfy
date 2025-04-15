import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const postInteractionRouter = createTRPCRouter({
  likePost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.postInteraction.likePost({
        postId: input.postId,
        userId: ctx.session.uid,
      });

      return result.match(
        () => undefined,
        (err) => {
          switch (err.name) {
            case "PostNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Post not found",
              });
            case "AlreadyLikedError":
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Post already liked",
              });
            case "FailedToLikePostError":
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to like post",
              });
          }
        },
      );
    }),

  unlikePost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.postInteraction.unlikePost({
        postId: input.postId,
        userId: ctx.session.uid,
      });

      return result.match(
        () => undefined,
        (err) => {
          switch (err.name) {
            case "PostNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Post not found",
              });
            case "NotLikedError":
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Post not liked",
              });
            case "FailedToUnlikePostError":
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to unlike post",
              });
          }
        },
      );
    }),

  hasLiked: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.postInteraction.hasLiked({
        postId: input.postId,
        userId: ctx.session.uid,
      });

      return result.match(
        (hasLiked) => hasLiked,
        (err) => {
          switch (err.name) {
            case "PostNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Post not found",
              });
            case "NotLikedError":
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Post not liked",
              });
          }
        },
      );
    }),


  addComment: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        body: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.postInteraction.addComment({
        postId: input.postId,
        userId: ctx.session.uid,
        body: input.body,
      });

      return result.match(
        () => undefined,
        (err) => {
          switch (err.name) {
            case "PostNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Post not found",
              });
            case "FailedToCommentError":
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to add comment",
              });
          }
        },
      );
    }),

  removeComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.postInteraction.removeComment({
        commentId: input.commentId,
        postId: input.postId,
        userId: ctx.session.uid,
      });

      return result.match(
        () => undefined,
        (err) => {
          switch (err.name) {
            case "CommentNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Comment not found",
              });
            case "NotCommentOwnerError":
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "You are not the owner of this comment",
              });
            case "FailedToDeleteCommentError":
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to delete comment",
              });
          }
        },
      );
    }),
});
