import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../../trpc";
import { container, TYPES } from "../../container";
import * as UserErrors from "../../errors/user/user.error";
import type { IUserService } from "../../interfaces/services/user/user.service.interface";

const userService = container.get<IUserService>(TYPES.UserService);

export const userRouter = createTRPCRouter({
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await ctx.services.user.deleteUser({ userId });

      return result.match(
        () => ({ success: true }),
        () => ({ success: true }), // Never case
      );
    }),

  userStatus: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.userStatus({ userId });

      return result.match(
        (status) => status,
        (error: UserErrors.UserError) => {
          if (error instanceof UserErrors.UserNotFound) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `User with ID ${userId} not found`,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unknown error occurred",
          });
        },
      );
    }),

  markUserAsOnApp: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.markUserAsOnApp({ userId });

      return result.match(
        () => ({ success: true }),
        () => ({ success: true }), // Never case
      );
    }),

  markUserAsTutorialComplete: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.markUserAsTutorialComplete({ userId });

      return result.match(
        () => ({ success: true }),
        () => ({ success: true }), // Never case
      );
    }),

  markUserAsOnboardingComplete: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.markUserAsOnboardingComplete({ userId });

      return result.match(
        () => ({ success: true }),
        () => ({ success: true }), // Never case
      );
    }),
});
