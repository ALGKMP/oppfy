import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

// Secret keys should be in environment variables in production
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? "your-access-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "your-refresh-secret-key";

const generateTokens = (uid: string) => {
  // Access token expires in 15 minutes
  const accessToken = jwt.sign({ uid }, JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });

  // Refresh token expires in 7 days
  const refreshToken = jwt.sign({ uid }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

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

        // Get or create user
        let user = await ctx.services.user.getUserByPhoneNumberNoThrow(
          input.phoneNumber,
        );

        // Generate a new user ID
        const userId = crypto.randomUUID();

        if (user && user.accountStatus === "notOnApp") {
          // Update existing user's ID and status
          await ctx.services.user.updateUserId(user.id, userId);
          await ctx.services.user.updateUserAccountStatus(userId, "onApp");

          // Fetch the updated user
          user = await ctx.services.user.getUserByPhoneNumber(
            input.phoneNumber,
          );
        } else if (!user) {
          // Create new user if they don't exist
          await ctx.services.user.createUser(
            userId,
            input.phoneNumber,
            "onApp",
          );

          // Fetch the newly created user
          user = await ctx.services.user.getUserByPhoneNumber(
            input.phoneNumber,
          );
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // In a production environment, you would want to:
        // 1. Store refresh token hash in database
        // 2. Set up refresh token rotation
        // 3. Implement refresh token reuse detection

        return {
          success: true,
          user,
          tokens: {
            accessToken,
            refreshToken,
          },
        };
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

  // Add a new procedure to refresh tokens
  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Verify the refresh token
        const payload = jwt.verify(input.refreshToken, JWT_REFRESH_SECRET) as {
          userId: string;
        };

        // Generate new tokens
        const tokens = generateTokens(payload.userId);

        return tokens;
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid refresh token",
        });
      }
    }),
});
