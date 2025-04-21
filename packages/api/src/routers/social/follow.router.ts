import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const followRouter = createTRPCRouter({
  followUser: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.follow.followUser({
        senderUserId: ctx.session.uid,
        recipientUserId: input.recipientUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "CannotFollowSelfError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot follow self",
              });
            }
            case "ProfileNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Profile not found",
              });
            }
            case "AlreadyFollowingError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Already following",
              });
            }
            case "FollowRequestAlreadySentError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Follow request already sent",
              });
            }
          }
        },
      );
    }),

  unfollowUser: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.follow.unfollowUser({
        senderUserId: ctx.session.uid,
        recipientUserId: input.recipientUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "NotFollowingError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Not following",
              });
            }
            case "MustUnfriendFirstError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Must unfriend first",
              });
            }
          }
        },
      );
    }),

  removeFollower: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.follow.removeFollower({
        senderUserId: ctx.session.uid,
        recipientUserId: input.recipientUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "NotFollowingError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Not following",
              });
            }
          }
        },
      );
    }),

  cancelFollowRequest: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.follow.cancelFollowRequest({
        senderUserId: ctx.session.uid,
        recipientUserId: input.recipientUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "FollowRequestNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Follow request not found",
              });
            }
          }
        },
      );
    }),

  acceptFollowRequest: protectedProcedure
    .input(
      z.object({
        senderUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.follow.acceptFollowRequest({
        selfUserId: ctx.session.uid,
        otherUserId: input.senderUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "FollowRequestNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Follow request not found",
              });
            }
          }
        },
      );
    }),

  declineFollowRequest: protectedProcedure
    .input(
      z.object({
        senderUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.follow.declineFollowRequest({
        senderUserId: input.senderUserId,
        recipientUserId: ctx.session.uid,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "FollowRequestNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Follow request not found",
              });
            }
          }
        },
      );
    }),

  paginateFollowers: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.follow.paginateFollowers({
        userId: input.userId ?? ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
        selfUserId: ctx.session.uid,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        },
      );
    }),

  paginateFollowing: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.follow.paginateFollowing({
        userId: input.userId ?? ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
        selfUserId: ctx.session.uid,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        },
      );
    }),

  paginateFollowRequests: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.follow.paginateFollowRequests({
        userId: ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        },
      );
    }),
});
