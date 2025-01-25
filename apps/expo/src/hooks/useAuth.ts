import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { api, queryClient } from "~/utils/api";
import { authService } from "~/utils/auth";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const deleteUserMutation = api.user.deleteUser.useMutation();
  const userOnboardingCompletedMutation =
    api.user.checkOnboardingComplete.useMutation();

  // Subscribe to auth state changes
  useEffect(() => {
    setIsLoading(false);
    return authService.subscribe(() => {
      // Force a re-render when auth state changes
      setIsLoading(false);
    });
  }, []);

  const sendVerificationCode = async (phoneNumber: string) => {
    await authService.sendVerificationCode(phoneNumber);
    return true;
  };

  const verifyPhoneNumber = async (phoneNumber: string, code: string) => {
    await authService.verifyPhoneNumber(phoneNumber, code);

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
      isNewUser: !userOnboardingCompleted,
    };
  };

  const signOut = () => {
    authService.signOut();
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  const deleteAccount = () => {
    void deleteUserMutation.mutateAsync();
    authService.signOut();
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  return {
    user: authService.currentUser,
    isLoading,
    isSignedIn: authService.isSignedIn,
    sendVerificationCode,
    verifyPhoneNumber,
    signOut,
    deleteAccount,
  };
}
