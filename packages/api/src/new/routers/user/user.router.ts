import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../../trpc";

export const userRouter = createTRPCRouter({
  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.services.user.deleteUser({
      userId: ctx.session.uid,
    });
  }),

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

  // userStatus: protectedProcedure
  //   .input(z.object({ userId: z.string().optional() }))
  //   .query(async ({ ctx, input }) => {
  //     const userId = input.userId ?? ctx.session.uid;
  //     const result = await userService.userStatus({ userId });

  //     return result.match(
  //       (status) => status,
  //       (error: UserErrors.UserError) => {
  //         if (error instanceof UserErrors.UserNotFound) {
  //           throw new TRPCError({
  //             code: "NOT_FOUND",
  //             message: `User with ID ${userId} not found`,
  //           });
  //         }
  //         throw new TRPCError({
  //           code: "INTERNAL_SERVER_ERROR",
  //           message: "Unknown error occurred",
  //         });
  //       },
  //     );
  //   }),

  // markUserAsOnApp: protectedProcedure
  //   .input(z.object({ userId: z.string().optional() }))
  //   .mutation(async ({ ctx, input }) => {
  //     const userId = input.userId ?? ctx.session.uid;
  //     const result = await userService.markUserAsOnApp({ userId });

  //     return result.match(
  //       () => ({ success: true }),
  //       () => ({ success: true }), // Never case
  //     );
  //   }),

  // markUserAsTutorialComplete: protectedProcedure
  //   .input(z.object({ userId: z.string().optional() }))
  //   .mutation(async ({ ctx, input }) => {
  //     const userId = input.userId ?? ctx.session.uid;
  //     const result = await userService.markUserAsTutorialComplete({ userId });

  //     return result.match(
  //       () => ({ success: true }),
  //       () => ({ success: true }), // Never case
  //     );
  //   }),

  // markUserAsOnboardingComplete: protectedProcedure
  //   .input(z.object({ userId: z.string().optional() }))
  //   .mutation(async ({ ctx, input }) => {
  //     const userId = input.userId ?? ctx.session.uid;
  //     const result = await userService.markUserAsOnboardingComplete({ userId });

  //     return result.match(
  //       () => ({ success: true }),
  //       () => ({ success: true }), // Never case
  //     );
  //   }),
});
