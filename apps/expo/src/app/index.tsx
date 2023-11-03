import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import { Text } from "tamagui";

import { api } from "~/utils/api";
import { useSession } from "~/contexts/SessionsContext";

const Index = () => {
  const { isSignedIn, isLoading, signOut } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return isSignedIn ? (
    <Redirect href="profile" />
  ) : (
    <Redirect href="phone-number" />
  );
};

export default Index;
