import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

export const userRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        phoneNumber: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // check if user already exists with phonenumber is is offapp, if so update the user id
        const user = await ctx.services.user.getUserByPhoneNumberNoThrow(
          input.phoneNumber,
        );
        if (user && user.accountStatus === "notOnApp") {
          await ctx.services.user.updateUserId(user.id, input.userId);
        } else {
          await ctx.services.user.createUser(input.userId, input.phoneNumber);
        }
      } catch (err) {
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

  onboardingComplete: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.user.checkOnboardingComplete(ctx.session?.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check if user has completed the onboarding process",
        cause: err,
      });
    }
  }),

  checkOnboardingComplete: publicProcedure.mutation(async ({ ctx }) => {
    try {
      return await ctx.services.user.checkOnboardingComplete(ctx.session?.uid);
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

  updateUserId: publicProcedure
    .input(
      z.object({
        oldUserId: z.string(),
        newUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.user.updateUserId(input.oldUserId, input.newUserId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user ID",
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
