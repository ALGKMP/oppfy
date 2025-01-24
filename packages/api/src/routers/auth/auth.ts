import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

export const authRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const status = await ctx.services.twilio.sendVerificationCode(
          input.phoneNumber,
        );
        return { status };
      } catch (error) {
        console.error("Error sending verification code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification code",
        });
      }
    }),

  verifyCode: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        code: z.string().length(6),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const isValid = await ctx.services.twilio.verifyCode(
          input.phoneNumber,
          input.code,
        );

        if (!isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid verification code",
          });
        }

        // Here you would typically:
        // 1. Create or fetch the user
        // 2. Generate a session token
        // 3. Return user data and token

        return { success: true };
      } catch (error) {
        console.error("Error verifying code:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify code",
        });
      }
    }),
});
