import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { createTRPCUntypedClient } from "@trpc/client";

export const friendRouter = createTRPCRouter({
  paginateFriendsSelf: protectedProcedure
    .input(trpcValidators.input.friend.paginateFriendsSelf)
    .output(trpcValidators.output.friend.paginateFriendSelf)
    .query(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.paginate.paginateFriends(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        return trpcValidators.output.friend.paginateFriendSelf.parse(result);
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFriendsOthers: protectedProcedure
    .input(trpcValidators.input.friend.paginateFriendsOther)
    .output(trpcValidators.output.friend.paginateFriendsOthers)
    .query(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.paginate.paginateFriends(
          input.userId,
          input.cursor,
          input.pageSize,
        );
        return trpcValidators.output.friend.paginateFriendsOthers.parse(result);
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  // TODO: Fix the logic behind this
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
    .input(trpcValidators.input.friend.sendFriendRequest)
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

  acceptFriendRequest: protectedProcedure
    .input(trpcValidators.input.friend.acceptFriendRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.friend.acceptFriendRequest(
          ctx.session.uid,
          input.recipientId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  rejectFriendRequest: protectedProcedure
    .input(trpcValidators.input.friend.rejectFriendRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.friend.rejectFriendRequest(
          ctx.session.uid,
          input.recipientId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

    cancelFriendRequest: protectedProcedure
    .input(trpcValidators.input.friend.cancelFriendRequest)
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
    .input(trpcValidators.input.friend.removeFriend)
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
