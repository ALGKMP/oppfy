import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const friendRouter = createTRPCRouter({
  getFriendRequestCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const friendRequestCount = await ctx.services.friend.countFriendRequests({
        userId: ctx.session.uid,
      });
      return friendRequestCount;
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
    }
  }),

  paginateFriendsSelf: protectedProcedure
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
        return await ctx.services.paginate.paginateFriendsSelf({
          userId: ctx.session.uid,
          cursor: input.cursor,
          pageSize: input.pageSize,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFriendsOthers: protectedProcedure
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
        return await ctx.services.paginate.paginateFriendsOthers({
          userId: input.userId,
          cursor: input.cursor,
          pageSize: input.pageSize,
          currentUserId: ctx.session.uid,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFriendRequests: protectedProcedure
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
          await ctx.services.paginate.paginateFriendRequests({
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

  sendFriendRequest: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.friend.sendFriendRequest({
          senderId: ctx.session.uid,
          recipientId: input.recipientId,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  acceptFriendRequest: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.friend.acceptFriendRequest({
          senderId: input.senderId,
          recipientId: ctx.session.uid,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  declineFriendRequest: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.friend.declineFriendRequest({
          senderId: input.senderId,
          recipientId: ctx.session.uid,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  cancelFriendRequest: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.friend.cancelFriendRequest({
          senderId: ctx.session.uid,
          recipientId: input.recipientId,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  removeFriend: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.friend.removeFriend({
          targetUserId: ctx.session.uid,
          otherUserId: input.recipientId,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
