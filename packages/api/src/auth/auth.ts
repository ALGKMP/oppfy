import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
// Import your database adapter here
// For example, if you're using Prisma:
// import { PrismaClient } from "@prisma/client";
// import { prismaAdapter } from "better-auth/adapters/prisma";
// const prisma = new PrismaClient();

// For this example, we'll use SQLite with better-sqlite3
import Database from "better-sqlite3";

import { env } from "@oppfy/env";

// Function to send OTP via SMS
// In a production environment, you would integrate with an SMS provider like Twilio
const sendOTP = async ({ phoneNumber, code }, request) => {
  console.log(`Sending OTP ${code} to ${phoneNumber}`);

  // For development/testing, we'll just log the code
  // In production, you would use an SMS service like:

  // Example with Twilio:
  // const twilioClient = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  // await twilioClient.messages.create({
  //   body: `Your verification code is: ${code}`,
  //   from: env.TWILIO_PHONE_NUMBER,
  //   to: phoneNumber
  // });

  return true;
};

export const auth = betterAuth({
  // Configure your database
  database: new Database("./better-auth.db"),

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
        getTempEmail: (phoneNumber) =>
          `${phoneNumber.replace(/[^0-9]/g, "")}@oppfy.app`,
        getTempName: (phoneNumber) => `User ${phoneNumber.slice(-4)}`,
      },
      // Callback after verification
      callbackOnVerification: async ({ phoneNumber, user }, request) => {
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
