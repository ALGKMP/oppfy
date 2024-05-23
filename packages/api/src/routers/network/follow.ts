import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@oppfy/validators";


import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const followRouter = createTRPCRouter({
  paginateFollowersSelf: protectedProcedure
    .input(trpcValidators.input.follow.paginateFollowersSelf)
    .output(trpcValidators.output.follow.paginateFollowersSelf)
    .query(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.paginate.paginateFollowers(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        return trpcValidators.output.follow.paginateFollowersSelf.parse(result);
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowersOthers: protectedProcedure
    .input(trpcValidators.input.follow.paginateFollowersOthers)
    .output(trpcValidators.output.follow.paginateFollowersOthers)
    .query(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.paginate.paginateFollowers(
          input.userId,
          input.cursor,
          input.pageSize,
          ctx.session.uid,
        );
        return trpcValidators.output.follow.paginateFollowersOthers.parse(
          result,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowingSelf: protectedProcedure
    .input(trpcValidators.input.follow.paginateFollowingSelf)
    .output(trpcValidators.output.follow.paginateFollowingSelf)
    .query(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.paginate.paginateFollowing(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        return trpcValidators.output.follow.paginateFollowingSelf.parse(result);
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowingOthers: protectedProcedure
    .input(trpcValidators.input.follow.paginateFollowingOthers)
    .output(trpcValidators.output.follow.paginateFollowingOthers)
    .query(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.paginate.paginateFollowing(
          input.userId,
          input.cursor,
          input.pageSize,
          ctx.session.uid,
        );
        return trpcValidators.output.follow.paginateFollowingOthers.parse(
          result,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  followUser: protectedProcedure
    .input(trpcValidators.input.follow.followUser)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.followUser(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  unfollowUser: protectedProcedure
    .input(trpcValidators.input.follow.unfollowUser)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.unfollowUser(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  acceptFollowRequest: protectedProcedure
    .input(trpcValidators.input.follow.acceptFollowRequest)
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
    .input(trpcValidators.input.follow.rejectFollowRequest)
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
    .input(trpcValidators.input.follow.cancelFollowRequest)
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

  removeFollower: protectedProcedure
    .input(trpcValidators.input.follow.removeFollower)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.follow.removeFollower(ctx.session.uid, input.userId);
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
