import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { api, queryClient } from "~/utils/api";
import { authClient } from "~/utils/better-auth";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, isPending } = authClient.useSession();

  const deleteUserMutation = api.user.deleteUser.useMutation();
  const tutorialCompleteMutation = api.user.checkTutorialComplete.useMutation();
  const userOnboardingCompletedMutation =
    api.user.checkOnboardingComplete.useMutation();

  // Set loading state based on session status
  useEffect(() => {
    setIsLoading(isPending);
  }, [isPending]);

  const sendVerificationCode = async (phoneNumber: string) => {
    try {
      // Use the fetch method to call the API directly
      await authClient.$fetch("/api/auth/send-verification-code", {
        method: "POST",
        body: { phoneNumber },
      });
      return true;
    } catch (error) {
      console.error("Error sending verification code:", error);
      return false;
    }
  };

  const verifyPhoneNumber = async (phoneNumber: string, code: string) => {
    try {
      // Use the fetch method to call the API directly
      console.log("Verifying phone number $$$$$$$$$$$$$$$$$$$$$$$$$$", phoneNumber, code);
      await authClient.$fetch("/api/auth/verify-code", {
        method: "POST",
        body: { phoneNumber, code },
      });
      console.log("Phone number verified $$$$$$$$$$$$$$$$$$$$$$$$$$");

      // Check if user needs onboarding
      const userOnboardingCompleted =
        await userOnboardingCompletedMutation.mutateAsync();
      console.log("User onboarding completed $$$$$$$$$$$$$$$$$$$$$$$$$$", userOnboardingCompleted);
      const tutorialComplete = await tutorialCompleteMutation.mutateAsync();
      console.log("Tutorial complete $$$$$$$$$$$$$$$$$$$$$$$$$$", tutorialComplete);

      if (!userOnboardingCompleted) {
        router.replace("/user-info/name");
        return;
      }

      if (!tutorialComplete) {
        router.replace("/tutorial/intro");
        return;
      }

      router.replace("/(app)/(bottom-tabs)/(home)");
    } catch (error) {
      console.error("Error verifying phone number:", error);
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  const deleteAccount = async () => {
    await deleteUserMutation.mutateAsync();
    await authClient.signOut();
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  return {
    user: session?.user || null,
    isLoading,
    isSignedIn: !!session,
    sendVerificationCode,
    verifyPhoneNumber,
    signOut,
    deleteAccount,
  };
}
