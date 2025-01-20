import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { PendingUserService } from "../../services/user/pendingUser";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

export const pendingUserRouter = createTRPCRouter({
  createPostForContact: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        contactName: z.string().optional(),
        mediaKey: z.string(),
        caption: z.string(),
        width: z.number(),
        height: z.number(),
        mediaType: z.enum(["image", "video"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pendingUserRecord =
        await ctx.services.pendingUser.createOrGetPendingUser({
          phoneNumber: input.phoneNumber,
        });

      if (!pendingUserRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pending user not found",
        });
      }
    }),

  checkPendingPosts: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.pendingUser.checkForPendingPosts(input.phoneNumber);
    }),

  updatePendingPostsStatus: protectedProcedure
    .input(
      z.object({
        postCount: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.pendingUser.updateUserPendingPostsStatus(
        ctx.session.user.id,
        input.postCount,
      );
    }),

  getPendingPosts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.pendingUser.getPendingPostsForUser(ctx.session.user.id);
  }),

  migratePendingPosts: protectedProcedure
    .input(
      z.object({
        pendingUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const migratedPosts = await ctx.services.pendingUser.migratePendingUserPosts({
        pendingUserId: input.pendingUserId,
        newUserId: ctx.session.user.id,
      });

      return migratedPosts;
    }),
});
