import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

export const authRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.services.auth.sendVerificationCode({
        phoneNumber: input.phoneNumber,
      });

      return result.match(
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload video post",
          });
        },
        (err) => {
          switch (err.name) {
            case "InvalidPhoneNumberError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid phone number",
              });
            }
            case "RateLimitExceededError": {
              throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: "Rate limit exceeded",
              });
            }
          }
        },
      );
    }),

  verifyCode: publicProcedure
    .input(z.object({ phoneNumber: z.string(), code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.services.auth.verifyCode({
        phoneNumber: input.phoneNumber,
        code: input.code,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "InvalidVerificationCodeError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid verification code",
              });
            }
            case "UserNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
              });
            }
            case "UserStatusNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "User status not found",
              });
            }
          }
        },
      );
    }),

  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(({ input, ctx }) => {
      const result = ctx.services.auth.refreshToken({
        refreshToken: input.refreshToken,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "InvalidRefreshTokenError":
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid refresh token",
              });
          }
        },
      );
    }),
});
