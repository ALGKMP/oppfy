import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@acme/validators";

import Services from "../services";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  updateFullName: protectedProcedure
    .input(trpcValidators.user.updateName)
    .mutation(async ({ input, ctx }) => {
      try {
        return await Services.profile.updateFullName(
          ctx.session.uid,
          input.fullName
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update name.",
        });
      }
    }),
  updateDateOfBirth: protectedProcedure
    .input(trpcValidators.user.updateDateOfBirth)
    .mutation(async ({ input, ctx }) => {
      try {
        return await Services.profile.updateDateOfBirth(
          ctx.session.uid,
          input.dateOfBirth,
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update date of birth.",
        });
      }
    }),

  updateUsername: protectedProcedure
    .input(trpcValidators.user.updateUsername)
    .mutation(async ({ input, ctx }) => {
      try {
        return await Services.user.updateUserUsername(
          ctx.session.uid,
          input.username,
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update username.",
        });
      }
    }),

  userOnboardingCompleted: protectedProcedure
    .input(trpcValidators.user.userComplete)
    .mutation(async ({ ctx }) => {
      try {
        const hasDOB = await Services.profile.profileHasDateOfBirth(
          ctx.session.uid,
        );
        const hasName = await Services.profile.profileHasName(ctx.session.uid);
        return hasDOB && hasName;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check user completion.",
        });
      }
    }),
});
