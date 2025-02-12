import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { DomainError, ErrorCode } from "../../errors";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

export const userRouter = createTRPCRouter({
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

  onboardingComplete: publicProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) return false;
      const user = await ctx.services.user.getUserStatus(ctx.session.uid);
      return user.hasCompletedOnboarding;
    } catch (err) {
      if (err instanceof DomainError) {
        if (err.code === ErrorCode.USER_NOT_FOUND) {
          return false;
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check if user has completed the onboarding process",
        cause: err,
      });
    }
  }),

  checkOnboardingComplete: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) return false;
      const user = await ctx.services.user.getUserStatus(ctx.session.uid);
      return user.hasCompletedOnboarding;
    } catch (err) {
      if (err instanceof DomainError) {
        if (err.code === ErrorCode.USER_NOT_FOUND) {
          return false;
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check if user has completed the onboarding process",
        cause: err,
      });
    }
  }),

  completedOnboarding: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) return false;
      await ctx.services.user.completedOnboarding(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to complete onboarding",
        cause: err,
      });
    }
  }),

  tutorialComplete: publicProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) return false;
      const user = await ctx.services.user.getUserStatus(ctx.session.uid);
      return user.hasCompletedTutorial;
    } catch (err) {
      if (err instanceof DomainError) {
        if (err.code === ErrorCode.USER_NOT_FOUND) {
          return false;
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check if user has completed the onboarding process",
        cause: err,
      });
    }
  }),

  checkTutorialComplete: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) return false;
      const user = await ctx.services.user.getUserStatus(ctx.session.uid);
      return user.hasCompletedTutorial;
    } catch (err) {
      if (err instanceof DomainError) {
        if (err.code === ErrorCode.USER_NOT_FOUND) {
          return false;
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check if user has completed the onboarding process",
        cause: err,
      });
    }
  }),

  setTutorialComplete: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) return false;
      await ctx.services.user.setTutorialComplete(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to complete tutorial",
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
        message: "Failed to get privacy settings",
        cause: err,
      });
    }
  }),

  updatePrivacySetting: protectedProcedure
    .input(
      z.object({
        privacy: z.enum(["public", "private"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.privacy.updatePrivacySettings(
          ctx.session.uid,
          input.privacy,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update privacy settings",
          cause: err,
        });
      }
    }),

  getUserByPhoneNumber: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.user.getUserByPhoneNumberNoThrow(
          input.phoneNumber,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get user by phone number",
          cause: err,
        });
      }
    }),
});
