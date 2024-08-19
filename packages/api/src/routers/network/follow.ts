import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { DomainError } from "../../errors";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const followRouter = createTRPCRouter({
  paginateFollowersSelf: protectedProcedure
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
        return await ctx.services.paginate.paginateFollowersSelf(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowersOthers: protectedProcedure
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
        return await ctx.services.paginate.paginateFollowersOthers(
          input.userId,
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowingSelf: protectedProcedure
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
        return await ctx.services.paginate.paginateFollowingSelf(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  paginateFollowingOthers: protectedProcedure
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
        return await ctx.services.paginate.paginateFollowingOthers(
          input.userId,
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),

  followUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.followUser(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        console.error(err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  followUsers: protectedProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.followUsers(
          ctx.session.uid,
          input.userIds,
        );
      } catch (err) {
        console.error(err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  unfollowUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.unfollowUser(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        if (err instanceof DomainError) {
          switch (err.code) {
            case "CANNOT_UNFOLLOW_FRIENDS":
              throw new TRPCError({
                code: "CONFLICT",
                message: "Cannot unfollow friends",
              });
          }
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  removeFollower: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.follow.removeFollower(ctx.session.uid, input.userId);
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  isFollowingSelf: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.follow.isFollowing(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
