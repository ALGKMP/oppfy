import { trpcValidators } from "@acme/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  updateFullName: protectedProcedure
    .input(trpcValidators.user.updateName)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.profile.updateFullName(
        ctx.session.uid,
        input.fullName,
      );
    }),

  updateDateOfBirth: protectedProcedure
    .input(trpcValidators.user.updateDateOfBirth)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.profile.updateDateOfBirth(
        ctx.session.uid,
        input.dateOfBirth,
      );
    }),

  updateUsername: protectedProcedure
    .input(trpcValidators.user.updateUsername)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.updateUsername(ctx.session.uid, input.username);
    }),

  updateNotificationSettings: protectedProcedure
    .input(trpcValidators.user.updateNotificationSettings)
    .mutation(async ({ input, ctx }) => {
      await ctx.services.user.updateNotificationSettings(
        ctx.session.uid,
        input,
      );
    }),
});
