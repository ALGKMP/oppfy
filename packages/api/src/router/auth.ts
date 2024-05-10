import { trpcValidators } from "@acme/validators";
import { TRPCError } from "@trpc/server";

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
          message: "Failed to create a new user. Please ensure the data is correct and try again."
        });
      }
    }),

  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.user.getUser(ctx.session.uid);
    } catch (err) {
      // Error handling for fetching user data
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve user data. User may not exist or there may be a server error."
      });
    }
  }),

  deleteUser: protectedProcedure
    .input(trpcValidators.auth.deleteUser)
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.user.deleteUser(input.userId);
      } catch (err) {
        // Error handling for deleting a user
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete user with ID ${input.userId}. Ensure the user exists and you have the necessary permissions.`
        });
      }
    }),

  userOnboardingCompleted: protectedProcedure
    .input(trpcValidators.user.userComplete)
    .mutation(async ({ ctx }) => {
      try {
        return await ctx.services.user.userOnboardingCompleted(ctx.session.uid);
      } catch (err) {
        // Error handling for onboarding completion
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark onboarding as completed. Please retry or contact support if the issue persists."
        });
      }
    }),
});