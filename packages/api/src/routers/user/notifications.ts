import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const notificationsRouter = createTRPCRouter({
  storePushToken: protectedProcedure
    .input(trpcValidators.input.notifications.storePushToken)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.notifications.storePushToken(
          ctx.session.uid,
          input.pushToken,
        );
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
          })
          .optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.notifications.paginateNotifications(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.notifications.getNotificationSettings(
        ctx.session.uid,
      );
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  updateNotificationSettings: protectedProcedure
    .input(trpcValidators.input.notifications.updateNotificationSettings)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.notifications.updateNotificationSettings(
          ctx.session.uid,
          input,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
