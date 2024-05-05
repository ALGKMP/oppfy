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
      // Could make this a query
      return await ctx.services.user.getFriends(input.userId);
    }),

  // TODO: Needs to be tested
  getFollowers: protectedProcedure
    .input(trpcValidators.user.getFollowers)
    .mutation(async ({ input, ctx }) => {
      // Could make this a query
      return await ctx.services.user.getFollowers(input.userId);
    }),

  // TODO: Review this
  getFollowing: protectedProcedure
    .input(trpcValidators.user.getFollowing)
    .mutation(async ({ input, ctx }) => {
      // Could make this a query
      return await ctx.services.user.getFollowing(input.userId);
    }),

  // TODO: Review this
  getFriendRequests: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.services.user.getFriendRequests(ctx.session.uid);
  }),

  // TODO: Review this
  getFollowerRequests: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.services.user.getFollowRequests(ctx.session.uid);
  }),

  // TODO: Block user - ig add another table for this, and remove any relationships (follow and friendship)


  // TODO: Follow user - don't forget to check if the account is private, and neither are blocked

  // TODO: Unfollow user - just delete the row

  // TODO: Accept follow request - delete request (or change status) and create a new graph connection

  // TODO: Reject follow request - delete the request

  // TODO: send friend request - check if neither parties are blocked first

  // TODO: accept friend request - delete request (or change status) and add a new graph connection

  // TODO: reject friend request - delete the request 

  // TODO: remove friend - delete the friend graph connection

  // TODO: remove follower - delete the follow network connection

  // TODO: check for follow and friend request
});
