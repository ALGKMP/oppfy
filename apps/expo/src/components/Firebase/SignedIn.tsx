import React from "react";
import type { ReactNode } from "react";
import firebase from "@react-native-firebase/app";

interface SignedInProps {
  children: ReactNode;
}

const SignedIn = ({ children }: SignedInProps) => {
  const user = firebase.auth().currentUser;

  // Render children only if the user is signed in
  return user?.emailVerified ? <>{children}</> : null;
};

export default SignedIn;
