import React from "react";
import { Redirect } from "expo-router";
import { TamaguiProvider } from "tamagui";

import { FirebaseLoaded, SignedIn, SignedOut } from "~/app/components/Firebase";

const Index = () => {
  return (
    <FirebaseLoaded>
      <SignedIn>
        <Redirect href="/home" />
      </SignedIn>
      <SignedOut>
        <Redirect href="/home" />
      </SignedOut>
    </FirebaseLoaded>
  );
};

export default Index;
