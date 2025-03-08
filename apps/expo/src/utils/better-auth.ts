import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";

// Create a storage adapter for SecureStore
const secureStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

// Create a better-auth client
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  storage: secureStorage,
});

// Export types for convenience
export type User = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  image: string | null;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
};

export type Session = {
  user: User;
  expires: string;
};
