import { TRPCError } from "@trpc/server";

import Services from "../services";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import ZodSchemas from "@acme/validators";

export const userRouter = createTRPCRouter({
  updateName: protectedProcedure
    .input(ZodSchemas.user.updateName)
    .mutation(async ({ input, ctx }) => {
      try {
        return await Services.profile.updateName(ctx.session.uid, input.name);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update name.",
        });
      }
    }),
  updateDateOfBirth: protectedProcedure
    .input(ZodSchemas.user.updateDateOfBirth)
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
    .input(ZodSchemas.user.updateUsername)
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

  userComplete: protectedProcedure
    .input(ZodSchemas.user.userComplete)
    .mutation(async ({ ctx }) => {
      try {
        const hasDOB = await Services.profile.profileHasDateOfBirth(
          ctx.session.uid,
        );
        const hasName = await Services.profile.profileHasName(ctx.session.uid);
        return hasDOB && hasName;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check user completion.",
        });
      }
    }),
});
