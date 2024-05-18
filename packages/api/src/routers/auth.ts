import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@oppfy/validators";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(trpcValidators.auth.createUser)
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.user.createUser(input.userId);
      } catch (err) {
        // Example error handling for when creating a user fails
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create a new user",
          cause: err,
        });
      }
    }),

  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await ctx.services.user.deleteUser(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to delete user with ID ${ctx.session.uid}`,
        cause: err
      });
    }
  }),

  markOnboardingComplete: protectedProcedure
    .input(trpcValidators.user.userComplete)
    .mutation(async ({ ctx }) => {
      try {
        return await ctx.services.user.checkOnboardingComplete(ctx.session.uid);
      } catch (err) {
        // Error handling for onboarding completion
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to check if user has completed the onboarding process",
          cause: err,
        });
      }
    }),
});
