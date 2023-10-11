import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";

interface SessionProviderProps {
  children: React.ReactNode;
}

interface SessionContextType {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<SessionContextType | undefined>(undefined);

const SessionProvider = ({ children }: SessionProviderProps) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  const isSignedIn = !!user;

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((authUser) => {
      console.log("Auth state changed:", authUser);
      setUser(authUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      router.replace("profile");
    } catch (error) {
      console.error(error);
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await auth().createUserWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isSignedIn, signIn, signOut, signUp }}
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
