// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { queryClient } from "~/utils/api";
import { auth } from "~/utils/auth";

export function useAuth() {
  const router = useRouter();
  const [, force] = useState({});

  useEffect(() => {
    const unsubscribe = auth.subscribe(() => force({}));
    return () => {
      unsubscribe();
    };
  }, []);

  const sendVerificationCode = auth.sendVerificationCode.bind(auth);
  const verifyPhoneNumber = auth.verifyPhoneNumber.bind(auth);
  const signOut = () => {
    auth.signOut();
    queryClient.clear();
    router.replace("/(onboarding)");
  };

  const deleteAccount = async () => {
    // example: call your API then sign out
    await queryClient.invalidateQueries();
    signOut();
  };

  return {
    user: auth.currentUser,
    isSignedIn: auth.isSignedIn,
    sendVerificationCode,
    verifyPhoneNumber,
    signOut,
    deleteAccount,
  };
}
