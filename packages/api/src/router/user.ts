import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@acme/validators";

import { DomainError, ErrorCode } from "../errors";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  updateFullName: protectedProcedure
    .input(trpcValidators.user.updateName)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.profile.updateFullName(
          ctx.session.uid,
          input.fullName,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  updateDateOfBirth: protectedProcedure
    .input(trpcValidators.user.updateDateOfBirth)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.profile.updateDateOfBirth(
          ctx.session.uid,
          input.dateOfBirth,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  updateUsername: protectedProcedure
    .input(trpcValidators.user.updateUsername)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.user.updateUsername(ctx.session.uid, input.username);
      } catch (err) {
        if (err instanceof DomainError) {
          switch (err.code) {
            case ErrorCode.USERNAME_ALREADY_EXISTS:
              throw new TRPCError({
                code: "CONFLICT",
              });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.user.getUserNotificationSettings(
        ctx.session.uid,
      );
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  updateNotificationSettings: protectedProcedure
    .input(trpcValidators.user.updateNotificationSettings)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.user.updateNotificationSettings(
          ctx.session.uid,
          input,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  getPrivacySetting: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.user.getUserPrivacySetting(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  updatePrivacySetting: protectedProcedure
    .input(trpcValidators.user.updatePrivacySetting)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.user.updatePrivacySetting(
          ctx.session.uid,
          input.privacy,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  // TODO: Test this
  getFriends: protectedProcedure
    .input(trpcValidators.user.getFriends)
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.user.getFriends(input.userId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  // TODO: Test this
  getFollowers: protectedProcedure
    .input(trpcValidators.user.getFollowers)
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.user.getFollowers(input.userId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  // TODO: Test this
  getFollowing: protectedProcedure
    .input(trpcValidators.user.getFollowing)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.user.getFollowing(input.userId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  getBlockedUsers: protectedProcedure
    .input(trpcValidators.user.paginate)
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.user.getBlockedUsers(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  getFriendRequests: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await ctx.services.user.getFriendRequests(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  // TODO: Test this
  getFollowerRequests: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await ctx.services.user.getFollowRequests(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  // TODO: Test this
  blockUser: protectedProcedure
    .input(trpcValidators.user.blockUser)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.user.blockUser(
          ctx.session.uid,
          input.blockedUserId,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  // TODO: Test this
  isUserBlocked: protectedProcedure
    .input(trpcValidators.user.isUserBlocked)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.user.isUserBlocked(
          ctx.session.uid,
          input.blockedUserId,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  // TODO: Test this
  unblockUser: protectedProcedure
    .input(trpcValidators.user.unblockUser)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.user.unblockUser(
          ctx.session.uid,
          input.blockedUserId,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  // TODO: Test this
  followUser: protectedProcedure
    .input(trpcValidators.user.follow)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.user.followUser(
          ctx.session.uid,
          input.recipientId,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  // TODO: Unfollow user
  unfollowUser: protectedProcedure
    .input(trpcValidators.user.follow)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.user.unfollowUser(
          ctx.session.uid,
          input.recipientId,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
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
});
