import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createAuthClient } from "better-auth/client";

import { getBaseUrl } from "./api";

// Create a storage adapter for SecureStore
const secureStorage = {
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
};

// Create the Better Auth client
export const authClient = createAuthClient({
  baseURL: getBaseUrl(), // Use the same base URL as your API
});

// Helper functions for phone authentication
export const sendVerificationCode = async (phoneNumber: string) => {
  try {
    // Use the API endpoint directly
    await fetch(`${getBaseUrl()}/api/auth/phone-number/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });
    return true;
  } catch (error) {
    console.error("Error sending verification code:", error);
    throw error;
  }
};

export const verifyPhoneNumber = async (phoneNumber: string, code: string) => {
  try {
    // Use the API endpoint directly
    const response = await fetch(
      `${getBaseUrl()}/api/auth/phone-number/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, code }),
      },
    );

    const result = await response.json();

    // Check if the user is authenticated
    const session = await authClient.getSession();

    if (session) {
      // Navigate to the appropriate screen based on user state
      router.replace("/(app)/(bottom-tabs)/(home)");
    }

    return result;
  } catch (error) {
    console.error("Error verifying phone number:", error);
    throw error;
  }
};

// Export session hooks
export const { useSession } = authClient;
