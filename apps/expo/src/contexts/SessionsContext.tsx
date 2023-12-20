import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { api } from "~/utils/api";

interface SessionContextType {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  signInWithPhoneNumber: (
    phoneNumber: string,
  ) => Promise<FirebaseAuthTypes.ConfirmationResult | null>;
  verifyPhoneNumberOTP: (
    otp: string,
  ) => Promise<FirebaseAuthTypes.UserCredential | null>; // Updated signature
}

interface SessionProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<SessionContextType | undefined>(undefined);

const SessionProvider = ({ children }: SessionProviderProps) => {
  const router = useRouter();

  const deleteUser = api.auth.deleteUser.useMutation();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const isSignedIn = !!user;

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((authUser) => {
      console.log("Auth state changed:", authUser);
      setUser(authUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithPhoneNumber = async (phoneNumber: string) => {
    const result = await auth().signInWithPhoneNumber(phoneNumber);
    setConfirmationResult(result);

    return result;
  };

  const verifyPhoneNumberOTP = async (otp: string) => {
    if (!confirmationResult) {
      throw new Error("No confirmation result available for OTP verification.");
    }

    return await confirmationResult.confirm(otp);
  };

  const signOut = async () => {
    await auth().signOut();
  };

  const deleteAccount = async () => {
    await deleteUser.mutateAsync();
    await user?.reload();
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

export const useSession = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
};

export default SessionProvider;
