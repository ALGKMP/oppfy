import { z } from "zod";

import { mediaTypeEnum } from "@oppfy/db/schema";

import { PendingUserService } from "../../services/user/pendingUser";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

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

  getPendingUserPosts: protectedProcedure
    .input(
      z.object({
        pendingUserId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return PendingUserService.getPendingUserPosts(input.pendingUserId);
    }),
});
