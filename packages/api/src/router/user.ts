import { TRPCError } from "@trpc/server";

import Services from "../services";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  updateDateOfBirthSchema,
  updateNameSchema,
  updateUsernameSchema,
  userCompleteSchema,
} from "../validation/user";

export const userRouter = createTRPCRouter({
  updateName: protectedProcedure
    .input(updateNameSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await Services.profile.updateName(ctx.session.uid, input.name);
      } catch (error) {
        console.error(
          "Error updating name:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update name.",
        });
      }
    }),

  updateDateOfBirth: protectedProcedure
    .input(updateDateOfBirthSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await Services.profile.updateDateOfBirth(
          ctx.session.uid,
          input.dateOfBirth,
        );
      } catch (error) {
        console.error(
          "Error updating date of birth:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update date of birth.",
        });
      }
    }),

  updateUsername: protectedProcedure
    .input(updateUsernameSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await Services.user.updateUserUsername(
          ctx.session.uid,
          input.username,
        );
      } catch (error) {
        console.error(
          "Error updating username:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update username.",
        });
      }
    }),

  userComplete: protectedProcedure
    .input(userCompleteSchema)
    .mutation(async ({ ctx }) => {
      try {
        const hasDOB = await Services.profile.profileHasDateOfBirth(
          ctx.session.uid,
        );
        const hasName = await Services.profile.profileHasName(ctx.session.uid);
        return hasDOB && hasName;
      } catch (error) {
        console.error(
          "Error checking profile completion:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check user completion.",
        });
      }
    }),
});
