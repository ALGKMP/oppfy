import React, { type ReactNode } from "react";
import firebase from "@react-native-firebase/app";

interface SignedOutProps {
  children: ReactNode;
}

const SignedOut = ({ children }: SignedOutProps) => {
  const user = firebase.auth().currentUser;

  // Render children only if the user is not signed in
  return !user?.emailVerified ? <>{children}</> : null;
};

export default SignedOut;
