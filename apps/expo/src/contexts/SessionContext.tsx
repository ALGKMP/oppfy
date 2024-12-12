import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { api, queryClient } from "~/utils/api";

interface SessionContextType {
  user: FirebaseAuthTypes.User | null;

  isLoading: boolean;
  isSignedIn: boolean;

  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  signInWithPhoneNumber: (phoneNumber: string) => Promise<boolean>;
  verifyPhoneNumberOTP: (
    otp: string,
  ) => Promise<FirebaseAuthTypes.UserCredential | null>;
}

interface SessionProviderProps {
  children: React.ReactNode;
}
type Status = "loading" | "success" | "error";

const AuthContext = createContext<SessionContextType | undefined>(undefined);

const SessionProvider = ({ children }: SessionProviderProps) => {
  const router = useRouter();

  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const [status, setStatus] = useState<Status>("loading");

  const deleteUser = api.user.deleteUser.useMutation();

  const isSignedIn = !!user;
  const isLoading = status === "loading";

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((authUser) => {
      setUser(authUser);
      setStatus("success");
    });

    return unsubscribe;
  }, []);

  const signInWithPhoneNumber = async (phoneNumber: string) => {
    // Existing code...
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    setConfirmation(confirmation);
    return confirmation.verificationId !== null; // Returns true if reCAPTCHA was shown
  };

  const verifyPhoneNumberOTP = async (otp: string) => {
    if (!confirmation) {
      throw new Error("No confirmation result available for OTP verification.");
    }

    return await confirmation.confirm(otp);
  };

  const signOut = async () => {
    await auth().signOut();
    await auth().currentUser?.reload();
    queryClient.clear();

    setUser(null);
    router.replace("/(onboarding)");
  };

  const deleteAccount = async () => {
    await deleteUser.mutateAsync();
    await auth().currentUser?.reload();
    queryClient.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
