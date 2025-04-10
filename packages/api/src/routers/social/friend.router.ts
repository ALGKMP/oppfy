import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const friendRouter = createTRPCRouter({
  friendUser: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.friend.friendUser({
        senderUserId: ctx.session.uid,
        recipientUserId: input.recipientUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "ProfileNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Profile not found",
              });
            }
            case "CannotFriendSelfError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot friend self",
              });
            }
            case "AlreadyFriendsError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Already friends",
              });
            }
            case "FriendRequestAlreadySentError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Friend request already sent",
              });
            }
          }
        },
      );
    }),

  unfriendUser: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.friend.unfriendUser({
        userIdA: ctx.session.uid,
        userIdB: input.recipientUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "FriendNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Friend not found",
              });
            }
          }
        },
      );
    }),

  cancelFriendRequest: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.friend.cancelFriendRequest({
        senderUserId: ctx.session.uid,
        recipientUserId: input.recipientUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "FriendRequestNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Friend request not found",
              });
            }
          }
        },
      );
    }),

  acceptFriendRequest: protectedProcedure
    .input(
      z.object({
        senderUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.friend.acceptFriendRequest({
        senderUserId: input.senderUserId,
        recipientUserId: ctx.session.uid,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "FriendRequestNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Friend request not found",
              });
            }
          }
        },
      );
    }),

  declineFriendRequest: protectedProcedure
    .input(
      z.object({
        senderUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.friend.declineFriendRequest({
        senderUserId: input.senderUserId,
        recipientUserId: ctx.session.uid,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "FriendRequestNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Friend request not found",
              });
            }
          }
        },
      );
    }),

  paginateFriends: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullable(),
        pageSize: z.number().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.friend.paginateFriends({
        userId: ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload video post",
          });
        },
      );
    }),

  paginateFriendRequests: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullable(),
        pageSize: z.number().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.friend.paginateFriendRequests({
        userId: ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload video post",
          });
        },
      );
    }),
});
