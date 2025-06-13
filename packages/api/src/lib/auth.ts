import { TRPCError } from "@trpc/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";

import { db } from "@oppfy/db";

import { container } from "../container";
import type { UserRepository } from "../repositories/user/user.repository";
import type { AuthService } from "../services/user/auth.service";
import { TYPES } from "../symbols";

const authService = container.get<AuthService>(TYPES.AuthService);
const userRepository = container.get<UserRepository>(TYPES.UserRepository);

export const auth = betterAuth({
  trustedOrigins: ["oppfy://"],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // const result = await authService.sendVerificationCode({
        //   phoneNumber,
        //   code,
        // });
        // return result.match(
        //   (_) => _,
        //   (err) => {
        //     switch (err.name) {
        //       case "InvalidPhoneNumberError": {
        //         throw new TRPCError({
        //           code: "BAD_REQUEST",
        //           message: "Invalid phone number",
        //         });
        //       }
        //       case "RateLimitExceededError": {
        //         throw new TRPCError({
        //           code: "TOO_MANY_REQUESTS",
        //           message: "Rate limit exceeded",
        //         });
        //       }
        //     }
        //   },
        // );
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          return `${phoneNumber}@oppfy.app`;
        },
      },
      callbackOnVerification: async ({ phoneNumber, user }) => {
        const isNewUser = user.createdAt.getTime() === user.updatedAt.getTime();
        console.log("IS NEW USER", isNewUser);

        if (isNewUser) {
          await db.transaction(async (tx) => {
            await userRepository.createUser({ phoneNumber }, tx);
          });
        }

        await userRepository.updateUserOnAppStatus({
          userId: user.id,
          isOnApp: true,
        });
      },
    }),
  ],
});
