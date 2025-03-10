import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { DomainError } from "../../errors";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const followRouter = createTRPCRouter({
  getFollowRequestCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const followRequestCount = await ctx.services.follow.countFollowRequests({
        userId: ctx.session.uid,
      });
      return followRequestCount;
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
    }
  }),

  paginateFollowersSelf: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            createdAt: z.date(),
            profileId: z.string(),
          })
          .nullable(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.paginate.paginateFollowersSelf({
          userId: ctx.session.uid,
          cursor: input.cursor,
          pageSize: input.pageSize,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowersOthers: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z
          .object({
            createdAt: z.date(),
            profileId: z.string(),
          })
          .nullable(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.paginate.paginateFollowersOthers({
          userId: input.userId,
          currentUserId: ctx.session.uid,
          cursor: input.cursor,
          pageSize: input.pageSize,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowingSelf: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            createdAt: z.date(),
            profileId: z.string(),
          })
          .nullable(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.paginate.paginateFollowingSelf({
          userId: ctx.session.uid,
          cursor: input.cursor,
          pageSize: input.pageSize,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowingOthers: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z
          .object({
            createdAt: z.date(),
            profileId: z.string(),
          })
          .nullable(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.paginate.paginateFollowingOthers({
          userId: input.userId,
          currentUserId: ctx.session.uid,
          cursor: input.cursor,
          pageSize: input.pageSize,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowRequests: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            createdAt: z.date(),
            profileId: z.string(),
          })
          .nullable(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const { items, nextCursor } =
          await ctx.services.paginate.paginateFollowRequests({
            userId: ctx.session.uid,
            cursor: input.cursor,
            pageSize: input.pageSize,
          });
        return {
          items,
          nextCursor,
        };
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  acceptFollowRequest: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.acceptFollowRequest({
          senderId: input.senderId,
          recipientId: ctx.session.uid,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  declineFollowRequest: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.declineFollowRequest({
          requestSenderId: input.senderId,
          requestRecipientId: ctx.session.uid,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  cancelFollowRequest: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.follow.cancelFollowRequest({
          senderId: ctx.session.uid,
          recipientId: input.recipientId,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  followUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.followUser({
          senderId: ctx.session.uid,
          recipientId: input.userId,
        });
      } catch (err) {
        console.error(err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  unfollowUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.unfollowUser({
          senderId: ctx.session.uid,
          recipientId: input.userId,
        });
      } catch (err) {
        if (err instanceof DomainError) {
          switch (err.code) {
            case "CANNOT_UNFOLLOW_FRIENDS":
              throw new TRPCError({
                code: "CONFLICT",
                message: "Cannot unfollow friends",
              });
          }
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  removeFollower: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.follow.removeFollower({
          userId: ctx.session.uid,
          followerToRemove: input.userId,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
