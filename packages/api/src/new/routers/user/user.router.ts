import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../../../trpc";
import { container, TYPES } from "../../container";
import type { IUserService } from "../../interfaces/services/user/user.service.interface";
import * as UserErrors from "../../errors/user/user.error";

const userService = container.get<IUserService>(TYPES.UserService);

// Zod schema for UserIdParams (optional userId, defaults to session uid)
const userIdSchema = z.object({
  userId: z.string().optional(), // Optional, will default to ctx.session.uid
});

export const userRouter = createTRPCRouter({
  deleteUser: protectedProcedure
    .input(userIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.deleteUser({ userId });

      // Since deleteUser returns Result<void, never>, no error handling needed
      if (result.isErr()) {
        // This shouldn't happen due to 'never', but included for completeness
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error deleting user",
        });
      }

      return { success: true };
    }),

  userStatus: protectedProcedure
    .input(userIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.userStatus({ userId });

      if (result.isErr()) {
        const error = result.error;
        if (error instanceof UserErrors.UserNotFound) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `User with ID ${userId} not found`,
          });
        }
        // Fallback for unexpected errors (shouldn't occur due to type constraint)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error fetching user status",
          cause: error,
        });
      }

      return result.value;
    }),

  markUserAsOnApp: protectedProcedure
    .input(userIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.markUserAsOnApp({ userId });

      if (result.isErr()) {
        // This shouldn't happen due to 'never', but included for robustness
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error marking user as on app",
        });
      }

      return { success: true };
    }),

  markUserAsTutorialComplete: protectedProcedure
    .input(userIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.markUserAsTutorialComplete({ userId });

      if (result.isErr()) {
        // This shouldn't happen due to 'never', but included for robustness
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error marking tutorial complete",
        });
      }

      return { success: true };
    }),

  markUserAsOnboardingComplete: protectedProcedure
    .input(userIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.uid;
      const result = await userService.markUserAsOnboardingComplete({ userId });

      if (result.isErr()) {
        // This shouldn't happen due to 'never', but included for robustness
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error marking onboarding complete",
        });
      }

      return { success: true };
    }),
});