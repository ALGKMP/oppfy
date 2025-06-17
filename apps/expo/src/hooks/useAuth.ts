import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { queryClient } from "~/utils/api";
import { auth } from "~/utils/auth";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [, force] = useState({});

  useEffect(() => {
    // Set loading to true and validate tokens during initialization
    setIsLoading(true);
    const initializeAuth = async () => {
      await auth.bootstrap(); // Load stored tokens
      await auth.ensureValidToken(); // Validate or refresh tokens
      setIsLoading(false);
    };

    initializeAuth().catch(() => {
      setIsLoading(false); // Ensure loading state is cleared on error
    });

    const unsubscribe = auth.subscribe(() => force({}));
    return () => {
      unsubscribe();
    };
  }, []);

  // Wrap ensureValidToken to update loading state
  const ensureValidToken = async () => {
    setIsLoading(true);
    try {
      return await auth.ensureValidToken();
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (phoneNumber: string) => {
    await ensureValidToken();
    await auth.sendVerificationCode(phoneNumber);
  };

  const verifyPhoneNumber = async (phoneNumber: string, code: string) => {
    await ensureValidToken();
    const result = await auth.verifyPhoneNumber(phoneNumber, code);
    return result;
  };

  const signOut = () => {
    auth.signOut();
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  const deleteAccount = async () => {
    await ensureValidToken();
    await queryClient.invalidateQueries();
    signOut();
  };

  return {
    user: auth.currentUser,
    isSignedIn: auth.isSignedIn,
    isLoading,
    sendVerificationCode,
    verifyPhoneNumber,
    signOut,
    deleteAccount,
  };
}