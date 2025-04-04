import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../../trpc";

export const postRouter = createTRPCRouter({
  uploadPostForUserOnAppUrl: protectedProcedure
    .input(
      z.object({
        recipient: z.string(),
        caption: z.string(),
        height: z.number(),
        width: z.number(),
        contentLength: z.number(),
        contentType: z.enum(["image/jpeg", "image/png", "image/heic"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.post.uploadPostForUserOnAppUrl({
        author: ctx.session.uid,
        ...input,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),

  uploadPostForUserNotOnAppUrl: protectedProcedure
    .input(
      z.object({
        recipientNotOnAppPhoneNumber: z.string(),
        recipientNotOnAppName: z.string(),
        caption: z.string(),
        height: z.number(),
        width: z.number(),
        contentLength: z.number(),
        contentType: z.enum(["image/jpeg", "image/png", "image/heic"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.post.uploadPostForUserNotOnAppUrl({
        author: ctx.session.uid,
        ...input,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),

  uploadVideoPostForUserOnAppUrl: protectedProcedure
    .input(
      z.object({
        recipient: z.string(),
        caption: z.string(),
        height: z.number(),
        width: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.post.uploadVideoPostForUserOnAppUrl({
        author: ctx.session.uid,
        ...input,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),

  uploadVideoPostForUserNotOnAppUrl: protectedProcedure
    .input(
      z.object({
        recipientNotOnAppPhoneNumber: z.string(),
        recipientNotOnAppName: z.string(),
        caption: z.string(),
        height: z.number(),
        width: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.post.uploadVideoPostForUserNotOnAppUrl({
        author: ctx.session.uid,
        ...input,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),

  deletePost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.post.deletePost({
        userId: ctx.session.uid,
        postId: input.postId,
      });

      return result.match(
        () => undefined,
        (err) => {
          switch (err.name) {
            case "NotPostOwnerError":
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "You are not the owner of this post",
              });
            case "PostNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Post not found",
              });
          }
        },
      );
    }),

  getPost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.post.getPost({
        userId: ctx.session.uid,
        postId: input.postId,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),

  paginatePosts: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullable()
          .optional(),
        pageSize: z.number().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.post.paginatePosts({
        userId: ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),

  paginatePostsForFeed: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullable()
          .optional(),
        pageSize: z.number().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.post.paginatePostsForFeed({
        userId: ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),

  getPostForNextJs: publicProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.post.getPostForNextJs({
        postId: input.postId,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),

  paginateComments: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullable()
          .optional(),
        pageSize: z.number().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.post.paginateComments({
        postId: input.postId,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),
});
