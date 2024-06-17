import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { trpcValidators } from "@oppfy/validators";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

export const userRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(trpcValidators.input.user.createUser)
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.user.createUser(input.userId, input.phoneNumber);
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
        cause: err,
      });
    }
  }),

  onboardingComplete: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.user.checkOnboardingComplete(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check if user has completed the onboarding process",
        cause: err,
      });
    }
  }),

  checkOnboardingComplete: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await ctx.services.user.checkOnboardingComplete(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check if user has completed the onboarding process",
        cause: err,
      });
    }
  }),

  getPrivacySetting: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.privacy.getPrivacySettings(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  updatePrivacySetting: protectedProcedure
    .input(trpcValidators.input.user.updatePrivacySetting)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.privacy.updatePrivacySettings(
          ctx.session.uid,
          input.privacy,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
});
