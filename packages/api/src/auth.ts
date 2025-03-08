import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
// Import the drizzle adapter
// @ts-ignore - Ignore missing type definitions
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import twilio from "twilio";

import { db } from "@oppfy/db";
import { env } from "@oppfy/env";

// Admin phone numbers that bypass Twilio verification
const ADMIN_PHONE_NUMBERS = [
  "+16478852142",
  "+16478852143",
  "+16478852144",
  "+16475504668",
  "+14107628976",
];

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

// Custom verification function for OTP
const verifyOTP = async ({
  phoneNumber,
  code,
}: {
  phoneNumber: string;
  code: string;
}): Promise<boolean> => {
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

        // Here you can add custom logic like updating user status
        // For example, you might want to set the user as "onApp" like in the previous implementation
        try {
          // In a real implementation, you would update the user status
          console.log(
            `User ${user.id} verified with phone number ${phoneNumber}`,
          );

          // Set admin status if it's an admin number
          if (isAdmin) {
            console.log(`Admin user verified: ${user.id}`);
          }
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
});

// Export the handler for API routes
export const authHandler = auth.handler;
