import React from "react";
import { Redirect } from "expo-router";

import { FirebaseLoaded, SignedIn, SignedOut } from "~/app/components/Firebase";


const Index = () => {
  return (
    <FirebaseLoaded>
      <SignedIn>
        <Redirect href="/" />
      </SignedIn>
      <SignedOut>
        <Redirect href="/" />
      </SignedOut>
    </FirebaseLoaded>
  );
};

export default Index;