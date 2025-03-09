import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
// import type { BetterAuthClientPlugin } from "better-auth/react";

// Create a better-auth client
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  plugins: [
    expoClient({
      scheme: "oppfy",
      storagePrefix: "oppfy",
      storage: SecureStore,
    })
  ],
});

// Export types for convenience
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  image: string | null;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
}

export interface Session {
  user: User;
  expires: string;
}
