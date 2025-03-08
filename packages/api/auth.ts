import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
// Import the drizzle adapter
// @ts-ignore - Ignore missing type definitions
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";

import { db } from "@oppfy/db";
import { env } from "@oppfy/env";

// Function to send OTP via SMS with proper types
const sendOTP = async (
  { phoneNumber, code }: { phoneNumber: string; code: string },
  request?: Request,
): Promise<void> => {
  console.log(`Sending OTP ${code} to ${phoneNumber}`);

  // For development/testing, we'll just log the code
  // In production, you would use an SMS service like Twilio:

  // Example with Twilio:
  // const twilioClient = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  // await twilioClient.messages.create({
  //   body: `Your verification code is: ${code}`,
  //   from: env.TWILIO_PHONE_NUMBER,
  //   to: phoneNumber
  // });
};

export const auth = betterAuth({
  // Use the drizzle adapter with the existing db instance
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
  }),

  // Set the secret key for encryption
  secret: env.BETTER_AUTH_SECRET || "your-secret-key-change-this-in-production",

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
        // You can add custom logic here, like creating a profile
      },
    }),
    // Add Expo plugin for better integration with Expo
    expo(),
  ],
});

// Export the handler for API routes
export const authHandler = auth.handler;
