import React, { useEffect, useState, type ReactNode } from "react";
import { Text } from "react-native";
import auth from "@react-native-firebase/auth";

interface FirebaseLoadedProps {
  children: ReactNode;
}

const FirebaseLoaded = ({ children }: FirebaseLoadedProps) => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((_user) => {
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  return <>{children}</>;
};

export default FirebaseLoaded;
