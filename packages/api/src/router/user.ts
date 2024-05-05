import { trpcValidators } from "@acme/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  updateFullName: protectedProcedure
    .input(trpcValidators.user.updateName)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.profile.updateFullName(
        ctx.session.uid,
        input.fullName,
      );
    }),

  updateDateOfBirth: protectedProcedure
    .input(trpcValidators.user.updateDateOfBirth)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.profile.updateDateOfBirth(
        ctx.session.uid,
        input.dateOfBirth,
      );
    }),

  updateUsername: protectedProcedure
    .input(trpcValidators.user.updateUsername)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.updateUsername(ctx.session.uid, input.username);
    }),

  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.services.user.getUserNotificationSettings(ctx.session.uid);
  }),

  updateNotificationSettings: protectedProcedure
    .input(trpcValidators.user.updateNotificationSettings)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.updateNotificationSettings(
        ctx.session.uid,
        input,
      );
    }),

  // TODO: Needs to be tested
  getFriends: protectedProcedure
    .input(trpcValidators.user.getFriends)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.getFriends(input.userId);
    }),

  // TODO: Needs to be tested
  getFollowers: protectedProcedure
    .input(trpcValidators.user.getFollowers)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.getFollowers(input.userId);
    }),

  // TODO: Needs to be tested
  getFollowing: protectedProcedure
    .input(trpcValidators.user.getFollowing)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.getFollowing(input.userId);
    }),

  // TODO: Get Friend Requests

  // TODO: Get Follower Requests

  // TODO: Follow user (sends a follow request if user account is private)

  // TODO: Unfollow user

  // TODO: Block user

  // TODO: send friend request

  // TODO: accept friend request

  // TODO: reject friend request

  // TODO: remove friend
});
