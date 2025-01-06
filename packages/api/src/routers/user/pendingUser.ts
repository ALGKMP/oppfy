import { z } from "zod";

import { PendingUserService } from "../../services/user/pendingUser";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import { TRPCError } from "@trpc/server";

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
      const pendingUserRecord = await PendingUserService.createOrGetPendingUser(
        {
          phoneNumber: input.phoneNumber,
          name: input.contactName,
        },
      );

      if (!pendingUserRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pending user not found",
        });
      }

      const post = await PendingUserService.createPostForPendingUser({
        authorId: ctx.session.user.id,
        pendingUserId: pendingUserRecord.id,
        phoneNumber: input.phoneNumber,
        mediaKey: input.mediaKey,
        caption: input.caption,
        width: input.width,
        height: input.height,
        mediaType: input.mediaType,
      });

      return post;
    }),

  checkPendingPosts: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return PendingUserService.checkForPendingPosts(input.phoneNumber);
    }),

  updatePendingPostsStatus: protectedProcedure
    .input(
      z.object({
        postCount: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await PendingUserService.updateUserPendingPostsStatus(
        ctx.session.user.id,
        input.postCount,
      );
    }),

  getPendingPosts: protectedProcedure.query(async ({ ctx }) => {
    return PendingUserService.getPendingPostsForUser(ctx.session.user.id);
  }),

  migratePendingPosts: protectedProcedure
    .input(
      z.object({
        pendingUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const migratedPosts = await PendingUserService.migratePendingUserPosts({
        pendingUserId: input.pendingUserId,
        newUserId: ctx.session.user.id,
      });

      return migratedPosts;
    }),
});
