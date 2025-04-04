import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "../../../trpc";

export const authRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.services.auth.sendVerificationCode({
        phoneNumber: input.phoneNumber,
      });

      return result.match(
        (res) => res,
        (_) => _,
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
            case "InvalidVerificationCodeError":
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid verification code",
              });
          }
        },
      );
    }),

  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.services.auth.refreshToken({
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
