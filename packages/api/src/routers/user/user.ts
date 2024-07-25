import { trpcValidators } from "@oppfy/validators";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  withAsyncErrorHandling,
} from "../../trpc";

export const userRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(trpcValidators.input.user.createUser)
    .mutation(({ ctx, input }) =>
      withAsyncErrorHandling(
        () => ctx.services.user.createUser(input.userId, input.phoneNumber),
        "Failed to create a new user",
      )(),
    ),

  deleteUser: protectedProcedure.mutation(({ ctx }) =>
    withAsyncErrorHandling(
      () => ctx.services.user.deleteUser(ctx.session.uid),
      `Failed to delete user with ID ${ctx.session.uid}`,
    )(),
  ),

  onboardingComplete: protectedProcedure.query(({ ctx }) =>
    withAsyncErrorHandling(
      () => ctx.services.user.checkOnboardingComplete(ctx.session.uid),
      "Failed to check if user has completed the onboarding process",
    )(),
  ),

  checkOnboardingComplete: protectedProcedure.mutation(({ ctx }) =>
    withAsyncErrorHandling(
      () => ctx.services.user.checkOnboardingComplete(ctx.session.uid),
      "Failed to check if user has completed the onboarding process",
    )(),
  ),

  getPrivacySetting: protectedProcedure.query(({ ctx }) =>
    withAsyncErrorHandling(
      () => ctx.services.privacy.getPrivacySettings(ctx.session.uid),
      "Failed to get privacy settings",
    )(),
  ),

  updatePrivacySetting: protectedProcedure
    .input(trpcValidators.input.user.updatePrivacySetting)
    .mutation(({ input, ctx }) =>
      withAsyncErrorHandling(
        () =>
          ctx.services.privacy.updatePrivacySettings(
            ctx.session.uid,
            input.privacy,
          ),
        "Failed to update privacy settings",
      )(),
    ),
});
