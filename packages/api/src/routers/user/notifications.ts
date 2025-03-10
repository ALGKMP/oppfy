import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const notificationsRouter = createTRPCRouter({
  storePushToken: protectedProcedure
    .input(
      z.object({
        pushToken: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.notifications.storePushToken({
          userId: ctx.session.uid,
          pushToken: input.pushToken,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  deletePushToken: protectedProcedure
    .input(z.object({ pushToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.notifications.deletePushToken({
          userId: ctx.session.uid,
          pushToken: input.pushToken,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getUnreadNotificationsCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.notifications.getUnreadNotificationsCount({
        userId: ctx.session.uid,
      });
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  paginateNotifications: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            createdAt: z.date(),
            id: z.string(),
          })
          .optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.notifications.paginateNotifications({
          userId: ctx.session.uid,
          cursor: input.cursor,
          pageSize: input.pageSize,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.notifications.getNotificationSettings({
        userId: ctx.session.uid,
      });
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        posts: z.boolean().optional(),
        likes: z.boolean().optional(),
        mentions: z.boolean().optional(),
        comments: z.boolean().optional(),
        followRequests: z.boolean().optional(),
        friendRequests: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.notifications.updateNotificationSettings({
          userId: ctx.session.uid,
          newNotificationSettings: input,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
