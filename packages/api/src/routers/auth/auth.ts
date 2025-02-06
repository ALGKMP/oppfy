import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { env } from "@oppfy/env";

import { createTRPCRouter, publicProcedure } from "../../trpc";

// Admin phone numbers that bypass Twilio verification
const ADMIN_PHONE_NUMBERS = ["+16478852142", "+16475504668", "+14107628976"];

// Secret keys should be in environment variables in production

const generateTokens = (uid: string) => {
  // Access token expires in 15 minutes
  const accessToken = jwt.sign({ uid }, env.JWT_ACCESS_SECRET, {
    expiresIn: "30m",
  });

  // Refresh token expires in 7 days
  const refreshToken = jwt.sign({ uid }, env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

  return { accessToken, refreshToken };
};

export const authRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // For admin numbers, don't actually send a code
      if (ADMIN_PHONE_NUMBERS.includes(input.phoneNumber)) {
        return { status: "pending" };
      }

      const status = await ctx.services.twilio.sendVerificationCode(
        input.phoneNumber,
      );
      return { status };
    }),

  verifyCode: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        code: z.string().length(6),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if the phone number is an admin number
      if (ADMIN_PHONE_NUMBERS.includes(input.phoneNumber)) {
        // For admin numbers, only accept "123456" as the code
        if (input.code !== "123456") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid verification code",
          });
        }

        // Check if admin user exists
        let user = await ctx.services.user.getUserByPhoneNumberNoThrow(
          input.phoneNumber,
        );

        let isNewUser = false;

        if (!user) {
          // Create admin user if they don't exist
          const userId = crypto.randomUUID();
          await ctx.services.user.createUser(userId, input.phoneNumber, true);
          user = await ctx.services.user.getUserByPhoneNumber(
            input.phoneNumber,
          );
          isNewUser = true;
        }

        // Generate tokens for admin
        const { accessToken, refreshToken } = generateTokens(user.id);
        return {
          success: true,
          isNewUser,
          tokens: {
            accessToken,
            refreshToken,
          },
        };
      }

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

      // Get or create user
      let user = await ctx.services.user.getUserByPhoneNumberNoThrow(
        input.phoneNumber,
      );

      let isNewUser = false;

      if (user) {
        const isOnApp = await ctx.services.user.isOnApp(user.id);

        if (!isOnApp) {
          await ctx.services.user.updateUserOnAppStatus(user.id, true);
          isNewUser = true;

          // Fetch the updated user
          user = await ctx.services.user.getUserByPhoneNumber(
            input.phoneNumber,
          );
        }
      } else {
        // Create new user if they don't exist
        const userId = crypto.randomUUID();
        await ctx.services.user.createUser(userId, input.phoneNumber, true);
        isNewUser = true;

        // Fetch the newly created user
        user = await ctx.services.user.getUserByPhoneNumber(input.phoneNumber);
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      return {
        success: true,
        isNewUser,
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    }),

  // Add a new procedure to refresh tokens
  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(({ input }) => {
      try {
        // Verify the refresh token
        const { uid } = jwt.verify(
          input.refreshToken,
          env.JWT_REFRESH_SECRET,
        ) as {
          uid: string;
        };

        // Generate new tokens
        const tokens = generateTokens(uid);

        return tokens;
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid refresh token",
        });
      }
    }),
});
