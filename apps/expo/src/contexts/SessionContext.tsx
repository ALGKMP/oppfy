import React, { createContext, useContext, useEffect, useState } from "react";
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
  ) => Promise<FirebaseAuthTypes.UserCredential | null>;
}

interface SessionProviderProps {
  children: React.ReactNode;
}
type Status = "loading" | "success" | "error";

const AuthContext = createContext<SessionContextType | undefined>(undefined);

const SessionProvider = ({ children }: SessionProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const [status, setStatus] = useState<Status>("loading");

  const deleteUser = api.user.deleteUser.useMutation();

  const isLoading = status === "loading";
  const isSignedIn = !!user;

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((authUser) => {
      setUser(authUser);
      setStatus("success");
    });

    return unsubscribe;
  }, []);

  const signInWithPhoneNumber = async (phoneNumber: string) => {
    const result = await auth().signInWithPhoneNumber(phoneNumber);
    setConfirmation(result);

    return result;
  };

  const verifyPhoneNumberOTP = async (otp: string) => {
    if (!confirmation) {
      throw new Error("No confirmation result available for OTP verification.");
    }

    return await confirmation.confirm(otp);
  };

  const signOut = async () => {
    await auth().signOut();
    setUser(null);
  };

  const deleteAccount = async () => {
    await deleteUser.mutateAsync();
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

export const useSession = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
};

export default SessionProvider;
