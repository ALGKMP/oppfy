import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const notificationsRouter = createTRPCRouter({
  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.notifications.getUserNotificationSettings(
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
