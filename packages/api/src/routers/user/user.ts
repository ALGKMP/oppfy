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
      await ctx.services.user.deleteUser({ userId: ctx.session.uid });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to delete user with ID ${ctx.session.uid}`,
        cause: err,
      });
    }
  }),

  getUserStatus: publicProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      return await ctx.services.user.getUserStatus({ userId: ctx.session.uid });
    } catch (err) {
      if (err instanceof DomainError) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user status",
        cause: err,
      });
    }
  }),

  userStatus: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      return await ctx.services.user.getUserStatus({
        userId: ctx.session.uid,
      });
    } catch (err) {
      if (err instanceof DomainError) {
        if (err.code === ErrorCode.USER_NOT_FOUND) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not found",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user status",
        cause: err,
      });
    }
  }),

  markOnboardingComplete: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) return false;
      await ctx.services.user.completedOnboarding({
        userId: ctx.session.uid,
      });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to complete onboarding",
        cause: err,
      });
    }
  }),

  markTutorialComplete: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.session?.uid) return false;
      await ctx.services.user.setTutorialComplete({ userId: ctx.session.uid });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to complete tutorial",
        cause: err,
      });
    }
  }),

  getPrivacy: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.privacy.getPrivacySettings({
        userId: ctx.session.uid,
      });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get privacy settings",
        cause: err,
      });
    }
  }),

  updatePrivacy: protectedProcedure
    .input(
      z.object({
        privacy: z.enum(["public", "private"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.privacy.updatePrivacySettings({
          userId: ctx.session.uid,
          newPrivacySetting: input.privacy,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update privacy settings",
          cause: err,
        });
      }
    }),
});
