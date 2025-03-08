import crypto from "crypto";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
// Import the drizzle adapter
// @ts-ignore - Ignore missing type definitions
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import jwt from "jsonwebtoken";
import twilio from "twilio";

import { db } from "@oppfy/db";
import { env } from "@oppfy/env";

import { services } from "./services";

// Admin phone numbers that bypass Twilio verification
const ADMIN_PHONE_NUMBERS = [
  "+16478852142",
  "+16478852143",
  "+16478852144",
  "+16475504668",
  "+14107628976",
];

// Function to generate JWT tokens
const generateTokens = (uid: string) => {
  // Access token expires in 30 minutes
  const accessToken = jwt.sign({ uid }, env.JWT_ACCESS_SECRET, {
    expiresIn: "30m",
  });

  // Refresh token expires in 30 days
  const refreshToken = jwt.sign({ uid }, env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

  return { accessToken, refreshToken };
};

// Function to send OTP via SMS with proper types
const sendOTP = async (
  { phoneNumber, code }: { phoneNumber: string; code: string },
  request?: Request,
): Promise<void> => {
  console.log(`Processing OTP for ${phoneNumber}`);

  // For admin numbers, don't actually send a code
  if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
    console.log(
      `Admin phone number detected: ${phoneNumber}. Skipping OTP send.`,
    );
    return;
  }

  try {
    // Create Twilio client
    const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    // Send verification code using Twilio Verify
    const verification = await twilioClient.verify.v2
      .services(env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    console.log(
      `Verification sent to ${phoneNumber}, status: ${verification.status}`,
    );
  } catch (error) {
    console.error(`Error sending OTP to ${phoneNumber}:`, error);
    throw error;
  }
};

// Custom verification function for OTP - this will be used internally
// Note: In better-auth, verification is handled internally before callbackOnVerification is called
const verifyOTPInternal = async (
  phoneNumber: string,
  code: string,
): Promise<boolean> => {
  console.log(`Verifying OTP for ${phoneNumber}`);

  // For admin numbers, only accept "123456" as the code
  if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
    console.log(`Admin phone number detected: ${phoneNumber}. Checking code.`);
    return code === "123456";
  }

  try {
    // Create Twilio client
    const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    // Verify the code using Twilio Verify
    const verificationCheck = await twilioClient.verify.v2
      .services(env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    console.log(
      `Verification check for ${phoneNumber}, status: ${verificationCheck.status}`,
    );

    // Return true if the verification was successful
    return verificationCheck.status === "approved";
  } catch (error) {
    console.error(`Error verifying OTP for ${phoneNumber}:`, error);
    return false;
  }
};

export const auth = betterAuth({
  // Use the drizzle adapter with the existing db instance
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
  }),

  // Set the secret key for encryption
  secret: env.BETTER_AUTH_SECRET || env.JWT_ACCESS_SECRET,

  // Set the base URL
  baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",

  // Add the phone number plugin
  plugins: [
    phoneNumber({
      sendOTP,
      // Allow users to sign up with phone number
      signUpOnVerification: {
        getTempEmail: (phoneNumber: string) =>
          `${phoneNumber.replace(/[^0-9]/g, "")}@oppfy.app`,
        getTempName: (phoneNumber: string) => `User ${phoneNumber.slice(-4)}`,
      },
      // Callback after verification
      callbackOnVerification: async (
        { phoneNumber, user }: { phoneNumber: string; user: any },
        request?: Request,
      ) => {
        console.log(`Phone number ${phoneNumber} verified for user ${user.id}`);

        // Check if this is an admin number
        const isAdmin = ADMIN_PHONE_NUMBERS.includes(phoneNumber);

        try {
          // Check if user exists in our system
          let existingUser =
            await services.user.getUserByPhoneNumberNoThrow(phoneNumber);
          let isNewUser = false;

          if (existingUser) {
            // Update user status to onApp if needed
            const isOnApp = await services.user.isOnApp(existingUser.id);
            if (!isOnApp) {
              await services.user.updateUserOnAppStatus(existingUser.id, true);
              isNewUser = true;
            }
          } else {
            // Create new user in our system
            const userId = user.id || crypto.randomUUID();
            await services.user.createUser(userId, phoneNumber, true);
            isNewUser = true;
          }

          // Generate tokens
          const tokens = generateTokens(user.id);

          // Store tokens or return them as needed
          // This depends on how better-auth handles session management
          console.log(`Generated tokens for user ${user.id}`);
        } catch (error) {
          console.error(
            `Error in callbackOnVerification for ${phoneNumber}:`,
            error,
          );
        }
      },
    }),
    // Add Expo plugin for better integration with Expo
    expo(),
  ],

  // Add event handlers for authentication events
  events: {
    // This event is triggered after a user is authenticated
    onAuth: async (context: { user: { id: string }; session: any }) => {
      // Generate tokens
      const tokens = generateTokens(context.user.id);

      // You can attach the tokens to the session or return them
      // This depends on how better-auth handles session management
      return {
        ...context.session,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    },
  },
});

// Export the handler for API routes
export const authHandler = auth.handler;

// Export the token generation function for use in other parts of the app
export { generateTokens };
