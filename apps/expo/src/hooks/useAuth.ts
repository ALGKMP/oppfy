import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { api, queryClient } from "~/utils/api";
import { auth } from "~/utils/auth";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const deleteUserMutation = api.user.deleteUser.useMutation();

  // Subscribe to auth state changes
  useEffect(() => {
    setIsLoading(false);
    return auth.subscribe(() => {
      // Force a re-render when auth state changes
      setIsLoading(false);
    });
  }, []);

  const sendVerificationCode = async (phoneNumber: string) => {
    await auth.sendVerificationCode(phoneNumber);
  };

  const verifyPhoneNumber = async (phoneNumber: string, code: string) => {
    return await auth.verifyPhoneNumber(phoneNumber, code);
  };

  const signOut = () => {
    auth.signOut();
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  const deleteAccount = async () => {
    await deleteUserMutation.mutateAsync();
    auth.signOut();
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  return {
    user: auth.currentUser,
    isLoading,
    isSignedIn: auth.isSignedIn,
    sendVerificationCode,
    verifyPhoneNumber,
    signOut,
    deleteAccount,
  };
}
