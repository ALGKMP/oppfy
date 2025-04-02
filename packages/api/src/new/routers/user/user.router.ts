import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../../trpc";

export const userRouter = createTRPCRouter({
  // TODO: We should be able to make these a protectedProcedure if the auth client is able to syncronously return token
  getUserStatus: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.uid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    const result = await ctx.services.user.userStatus({
      userId: ctx.session.uid,
    });

    return result.match(
      (result) => result,
      (err) => {
        switch (err.name) {
          case "UserNotFoundError":
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `User with ID ${ctx.session?.uid} not found`,
            });
        }
      },
    );
  }),

  fetchUserStatus: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.uid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    const result = await ctx.services.user.userStatus({
      userId: ctx.session.uid,
    });

    return result.match(
      (result) => result,
      (err) => {
        switch (err.name) {
          case "UserNotFoundError":
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `User with ID ${ctx.session?.uid} not found`,
            });
        }
      },
    );
  }),

  getPrivacy: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.services.profile.privacy({
      userId: ctx.session.uid,
    });

    return result.match(
      (privacy) => privacy,
      (err) => {
        switch (err.name) {
          case "ProfileNotFoundError":
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Profile with ID ${ctx.session.uid} not found`,
            });
        }
      },
    );
  }),

  updateName: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.services.profile.updateProfile({
        userId: ctx.session.uid,
        update: {
          name: input.name,
        },
      });
    }),

  updateUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.services.profile.updateProfile({
        userId: ctx.session.uid,
        update: {
          username: input.username,
        },
      });
    }),

  updateBio: protectedProcedure
    .input(z.object({ bio: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.services.profile.updateProfile({
        userId: ctx.session.uid,
        update: {
          bio: input.bio,
        },
      });
    }),

  updateDateOfBirth: protectedProcedure
    .input(z.object({ dateOfBirth: z.date() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.services.profile.updateProfile({
        userId: ctx.session.uid,
        update: {
          dateOfBirth: input.dateOfBirth,
        },
      });
    }),

  updatePrivacy: protectedProcedure
    .input(z.object({ privacy: z.enum(["public", "private"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.services.profile.updateProfile({
        userId: ctx.session.uid,
        update: {
          privacy: input.privacy,
        },
      });
    }),

  markOnboardingComplete: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.services.user.markUserAsOnboardingComplete({
      userId: ctx.session.uid,
    });
  }),

  markTutorialComplete: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.services.user.markUserAsTutorialComplete({
      userId: ctx.session.uid,
    });
  }),

  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.services.user.deleteUser({
      userId: ctx.session.uid,
    });
  }),
});
