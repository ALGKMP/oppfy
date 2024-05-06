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

  // TODO: Needs to be tested
  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.services.user.getUserNotificationSettings(ctx.session.uid);
  }),

  // TODO: Needs to be tested
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

  // TODO: Needs to be tested
  blockUser: protectedProcedure
    .input(trpcValidators.user.blockUser)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.blockUser(
        ctx.session.uid,
        input.blockedUserId,
      );
    }),

  // TODO: Test this
  isUserBlocked: protectedProcedure
    .input(trpcValidators.user.isUserBlocked)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.isUserBlocked(
        ctx.session.uid,
        input.blockedUserId,
      );
    }),

  // TODO: Test this
  unblockUser: protectedProcedure
    .input(trpcValidators.user.unblockUser)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.unblockUser(
        ctx.session.uid,
        input.blockedUserId,
      );
    }),

  // TODO: Test this
  followUser: protectedProcedure
    .input(trpcValidators.user.follow)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.followUser(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  // TODO: Unfollow user
  unfollowUser: protectedProcedure
    .input(trpcValidators.user.follow)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.unfollowUser(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  // TODO: Accept follow request - delete request (or change status) and create a new graph connection
  acceptFollowRequest: protectedProcedure
    .input(trpcValidators.user.follow)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.acceptFollowRequest(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  // TODO: Reject follow request - delete the request
  rejectFollowRequest: protectedProcedure
    .input(trpcValidators.user.follow)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.rejectFollowRequest(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  sendFriendRequest: protectedProcedure
    .input(trpcValidators.user.follow)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.user.sendFriendRequest(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  // TODO: accept friend request - delete request (or change status) and add a new graph connection
  acceptFriendRequest: protectedProcedure
    .input(trpcValidators.user.friendRequest)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.acceptFriendRequest(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  // TODO: reject friend request - delete the request
  rejectFriendRequest: protectedProcedure
    .input(trpcValidators.user.friendRequest)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.rejectFriendRequest(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  // TODO: remove friend - delete the friend graph connection
  removeFriend: protectedProcedure
    .input(trpcValidators.user.friendRequest)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.removeFriend(ctx.session.uid, input.recipientId);
    }),

  // TODO: remove follower - delete the follow network connection
  removeFollower: protectedProcedure
    .input(trpcValidators.user.friendRequest)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.removeFollower(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  // TODO: Cancel follow/friend request
  cancelFollowRequest: protectedProcedure
    .input(trpcValidators.user.friendRequest)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.cancelFollowRequest(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  cancelFriendRequest: protectedProcedure
    .input(trpcValidators.user.follow)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.cancelFriendRequest(
        ctx.session.uid,
        input.recipientId,
      );
    }),

  // TODO: paginate follow and friend requests

  // TODO: paginate blocked users
});
