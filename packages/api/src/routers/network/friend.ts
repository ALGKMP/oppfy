import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const friendRouter = createTRPCRouter({
  paginateFriendsSelf: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            createdAt: z.date(),
            profileId: z.string(),
          })
          .optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.paginate.paginateFriendsSelf(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
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
          .optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.paginate.paginateFriendsOthers(
          input.userId,
          input.cursor,
          input.pageSize,
          ctx.session.uid,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFriendsOthersByProfileId: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z
          .object({
            createdAt: z.date(),
            profileId: z.string(),
          })
          .optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.paginate.paginateFriendsOthers(
          input.userId,
          input.cursor,
          input.pageSize,
          ctx.session.uid,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFriendRequestsSelf: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await ctx.services.paginate.paginateFriendRequests(
        ctx.session.uid,
      );
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
        return await ctx.services.friend.sendFriendRequest(
          ctx.session.uid,
          input.recipientId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
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
        await ctx.services.friend.cancelFriendRequest(
          ctx.session.uid,
          input.recipientId,
        );
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
        await ctx.services.friend.removeFriend(
          ctx.session.uid,
          input.recipientId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
