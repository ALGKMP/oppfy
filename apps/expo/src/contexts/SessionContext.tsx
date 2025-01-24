import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { api, queryClient } from "~/utils/api";
import { storage } from "~/utils/storage";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionContextType {
  user: FirebaseAuthTypes.User | null;
  tokens: AuthTokens | null;

  isLoading: boolean;
  isSignedIn: boolean;

  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  signInWithPhoneNumber: (phoneNumber: string) => Promise<boolean>;
  verifyPhoneNumberOTP: (
    phoneNumber: string,
    otp: string,
  ) => Promise<{ user: FirebaseAuthTypes.User; tokens: AuthTokens } | null>;
}

interface SessionProviderProps {
  children: React.ReactNode;
}

type Status = "loading" | "success" | "error";

const AuthContext = createContext<SessionContextType | undefined>(undefined);

const SessionProvider = ({ children }: SessionProviderProps) => {
  const router = useRouter();

  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // API mutations
  const sendVerificationCode = api.auth.sendVerificationCode.useMutation();
  const verifyCode = api.auth.verifyCode.useMutation();
  const refreshTokenMutation = api.auth.refreshToken.useMutation();
  const deleteUser = api.user.deleteUser.useMutation();
  const userOnboardingCompletedMutation =
    api.user.checkOnboardingComplete.useMutation();

  const isSignedIn = !!user && !!tokens;
  const isLoading = status === "loading";

  // Load tokens from storage on startup
  useEffect(() => {
    const storedTokens = storage.getString("auth_tokens");
    if (storedTokens) {
      setTokens(JSON.parse(storedTokens) as AuthTokens);
    }
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((authUser) => {
      setUser(authUser);
      setStatus("success");
    });

    return unsubscribe;
  }, []);

  const signInWithPhoneNumber = async (phoneNumber: string) => {
    try {
      // First send verification code through our API
      await sendVerificationCode.mutateAsync({ phoneNumber });

      // Then initiate Firebase phone auth
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirmation(confirmation);
      return confirmation.verificationId !== null;
    } catch (error) {
      console.error("Error sending verification code:", error);
      throw error;
    }
  };

  const verifyPhoneNumberOTP = async (phoneNumber: string, otp: string) => {
    if (!confirmation) {
      throw new Error("No confirmation result available for OTP verification.");
    }

    try {
      // First verify with Firebase
      const credential = await confirmation.confirm(otp);

      if (!credential.user) {
        throw new Error("No user returned from Firebase auth");
      }

      // Then verify with our API and get JWT tokens
      const result = await verifyCode.mutateAsync({
        phoneNumber,
        code: otp,
      });

      if (!result.success || !result.tokens) {
        throw new Error("Failed to verify code with API");
      }

      // Store tokens
      setTokens(result.tokens);
      storage.set("auth_tokens", JSON.stringify(result.tokens));

      // Check if user needs onboarding
      const userOnboardingCompleted =
        await userOnboardingCompletedMutation.mutateAsync();

      // Navigate based on onboarding status
      router.replace(
        userOnboardingCompleted
          ? "/(app)/(bottom-tabs)/(home)"
          : "/user-info/name",
      );

      return {
        user: credential.user,
        tokens: result.tokens,
      };
    } catch (error) {
      console.error("Error verifying code:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await auth().signOut();
    storage.delete("auth_tokens");
    setTokens(null);
    setUser(null);
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  const deleteAccount = async () => {
    await deleteUser.mutateAsync();
    await auth().currentUser?.delete();
    storage.delete("auth_tokens");
    setTokens(null);
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isLoading,
        isSignedIn,
        deleteAccount,
        signOut,
        signInWithPhoneNumber,
        verifyPhoneNumberOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useSession = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
};

export { SessionProvider, useSession };
