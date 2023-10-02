import React from "react";
import { Redirect, Slot } from "expo-router";
import { TamaguiProvider } from "tamagui";

import { auth } from "@acme/api/src/services/firebase";

import { FirebaseLoaded, SignedIn, SignedOut } from "~/components/Firebase";

const Index = () => {
  return (
    <FirebaseLoaded>
      <SignedIn>
        <Redirect href="/profile" />
      </SignedIn>
      <SignedOut>
        <Redirect href="/auth-welcome" />
      </SignedOut>
    </FirebaseLoaded>
  );
};

export default Index;
