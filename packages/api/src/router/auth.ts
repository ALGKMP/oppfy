import { TRPCError } from "@trpc/server";

import Services from "../services";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import ZodSchemas from "../validation";

export const authRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(ZodSchemas.auth.createUser)
    .mutation(async ({ input }) => {
      try {
        return await Services.user.createUser(input.userId);
      } catch (error) {
        console.error(
          "Error creating user:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "CONFLICT", // Use 'CONFLICT' if user already exists, or another appropriate code based on the error
          message: "Failed to create user.",
        });
      }
    }),
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await Services.user.getUser(ctx.session.uid);
    } catch (error) {
      console.error(
        "Error retrieving user:",
        error instanceof Error ? error.message : error,
      );
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Failed to retrieve user with ID ${ctx.session.uid}`,
      });
    }
  }),
  deleteUser: protectedProcedure
    .input(ZodSchemas.auth.deleteUser)
    .mutation(async ({ input }) => {
      try {
        await Services.user.deleteUser(input.userId);
        return { success: true, message: "User successfully deleted." };
      } catch (error) {
        console.error(
          "Error deleting user:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user.",
        });
      }
    }),
  updateUserUsername: protectedProcedure
    .input(ZodSchemas.auth.updateUser)
    .mutation(async ({ input }) => {
      try {
        await Services.user.updateUserUsername(input.userId, input.username);
        return { success: true, message: "Username successfully updated." };
      } catch (error) {
        console.error(
          "Error updating username:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update username.",
        });
      }
    }),
});

export type AuthRouter = typeof authRouter;
