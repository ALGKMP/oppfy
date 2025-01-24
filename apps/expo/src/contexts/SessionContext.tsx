import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { api, queryClient } from "~/utils/api";
import { storage } from "~/utils/storage";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  uid: string;
}

interface SessionContextType {
  user: User | null;
  tokens: AuthTokens | null;

  isLoading: boolean;
  isSignedIn: boolean;

  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  sendVerificationCode: (phoneNumber: string) => Promise<boolean>;
  verifyPhoneNumber: (
    phoneNumber: string,
    code: string,
  ) => Promise<{ tokens: AuthTokens; isNewUser: boolean }>;
}

interface SessionProviderProps {
  children: React.ReactNode;
}

type Status = "loading" | "success" | "error";

const AuthContext = createContext<SessionContextType | undefined>(undefined);


function parseJwt(token: string): User {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  
  const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );

  return JSON.parse(jsonPayload);
}

const SessionProvider = ({ children }: SessionProviderProps) => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // API mutations
  const sendVerificationCodeMutation =
    api.auth.sendVerificationCode.useMutation();
  const verifyCodeMutation = api.auth.verifyCode.useMutation();
  const refreshTokenMutation = api.auth.refreshToken.useMutation();
  const deleteUserMutation = api.user.deleteUser.useMutation();
  const userOnboardingCompletedMutation =
    api.user.checkOnboardingComplete.useMutation();

  const isSignedIn = !!user && !!tokens;
  const isLoading = status === "loading";

  // Load tokens and user from storage on startup
  useEffect(() => {
    const storedTokens = storage.getString("auth_tokens");

    if (storedTokens) {
      const parsedTokens = JSON.parse(storedTokens) as AuthTokens;
      setTokens(parsedTokens);
      // parse jwt and pull uid out
      const jwt = parseJwt(parsedTokens.accessToken);
      setUser({ uid: jwt.uid });
    }
    setStatus("success");
  }, []);

  // Refresh token setup
  useEffect(() => {
    if (!tokens?.refreshToken) return;

    const refreshTokens = async () => {
      try {
        const newTokens = await refreshTokenMutation.mutateAsync({
          refreshToken: tokens.refreshToken,
        });
        setTokens(newTokens);
        storage.set("auth_tokens", JSON.stringify(newTokens));
      } catch (error) {
        console.error("Failed to refresh tokens:", error);
        // If refresh fails, sign out
        void signOut();
      }
    };

    // Refresh tokens 1 minute before access token expires
    const timer = setInterval(refreshTokens, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(timer);
  }, [tokens?.refreshToken]);

  const sendVerificationCode = async (phoneNumber: string) => {
    try {
      await sendVerificationCodeMutation.mutateAsync({ phoneNumber });
      return true;
    } catch (error) {
      console.error("Error sending verification code:", error);
      throw error;
    }
  };

  const verifyPhoneNumber = async (phoneNumber: string, code: string) => {
    try {
      const result = await verifyCodeMutation.mutateAsync({
        phoneNumber,
        code,
      });

      if (!result.success || !result.tokens) {
        throw new Error("Failed to verify code with API");
      }

      // Store tokens and user
      setTokens(result.tokens);
      const jwt = parseJwt(result.tokens.accessToken);
      setUser({ uid: jwt.uid });
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
        tokens: result.tokens,
        isNewUser: result.isNewUser,
      };
    } catch (error) {
      console.error("Error verifying code:", error);
      throw error;
    }
  };

  const signOut = async () => {
    storage.delete("auth_tokens");
    storage.delete("auth_user");
    setTokens(null);
    setUser(null);
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  const deleteAccount = async () => {
    await deleteUserMutation.mutateAsync();
    storage.delete("auth_tokens");
    storage.delete("auth_user");
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
        sendVerificationCode,
        verifyPhoneNumber,
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
function jwtDecode(accessToken: string) {
  throw new Error("Function not implemented.");
}
