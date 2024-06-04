import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { trpcValidators } from "@oppfy/validators";

import { friend } from "../../../../db/src/schema/schema";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const requestRouter = createTRPCRouter({
  paginateFriendRequests: protectedProcedure
    .input(trpcValidators.input.request.paginateFriendRequests)
    .output(trpcValidators.output.request.paginateFriendRequests)
    .query(async ({ input, ctx }) => {
      try {
        const { items, nextCursor } =
          await ctx.services.paginate.paginateFriendRequests(
            ctx.session.uid,
            input.cursor,
            input.pageSize,
          );
        return trpcValidators.output.request.paginateFriendRequests.parse({
          items,
          nextCursor,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowRequests: protectedProcedure
    .input(trpcValidators.input.request.paginateFollowRequests)
    .output(trpcValidators.output.request.paginateFollowRequests)
    .query(async ({ input, ctx }) => {
      try {
        const { items, nextCursor } =
          await ctx.services.paginate.paginateFollowRequests(
            ctx.session.uid,
            input.cursor,
            input.pageSize,
          );
        return trpcValidators.output.request.paginateFollowRequests.parse({
          items,
          nextCursor,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  countRequests: protectedProcedure
    .output(trpcValidators.output.request.countRequests)
    .query(async ({ ctx }) => {
      try {
        const followRequestCount =
          await ctx.services.follow.countFollowRequests(ctx.session.uid);
        const friendRequestCount =
          await ctx.services.friend.countFriendRequests(ctx.session.uid);
        return trpcValidators.output.request.countRequests.parse({
          followRequestCount,
          friendRequestCount,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  sendFriendRequest: protectedProcedure
    .input(trpcValidators.input.request.sendFriendRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.friend.sendFriendRequest(
          ctx.session.uid,
          input.recipientId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  acceptFriendRequest: protectedProcedure
    .input(trpcValidators.input.request.acceptFriendRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.friend.acceptFriendRequest(
          ctx.session.uid,
          input.senderId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  rejectFriendRequest: protectedProcedure
    .input(trpcValidators.input.request.rejectFriendRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.friend.rejectFriendRequest(
          ctx.session.uid,
          input.senderId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  cancelFriendRequest: protectedProcedure
    .input(trpcValidators.input.request.cancelFriendRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.friend.cancelFriendRequest(
          ctx.session.uid,
          input.recipientId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  acceptFollowRequest: protectedProcedure
    .input(trpcValidators.input.request.acceptFollowRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.acceptFollowRequest(
          input.userId,
          ctx.session.uid,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  rejectFollowRequest: protectedProcedure
    .input(trpcValidators.input.request.rejectFollowRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.rejectFollowRequest(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  cancelFollowRequest: protectedProcedure
    .input(trpcValidators.input.request.cancelFollowRequest)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.follow.cancelFollowRequest(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
