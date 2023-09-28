import React from "react";
import { Redirect } from "expo-router";

import { FirebaseLoaded, SignedIn, SignedOut } from "~/app/components/Firebase";


const Index = () => {
  return (
    <FirebaseLoaded>
      <SignedIn>
        <Redirect href="/home" />
      </SignedIn>
      <SignedOut>
        <Redirect href="/signin" />
      </SignedOut>
    </FirebaseLoaded>
  );
};

export default Index;