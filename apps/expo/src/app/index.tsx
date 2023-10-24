import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import auth from "@react-native-firebase/auth";
import { Text } from "tamagui";

import { api } from "~/utils/api";
import { useSession } from "~/contexts/SessionsContext";
import FirstName from "./(user-info)/first-name";

const Index = () => {
  const { isSignedIn, isLoading, signOut } = useSession();
  const { isLoading: getUserIsLoading, data: userData } =
    api.auth.getUser.useQuery();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (isSignedIn && userData?.firstName && userData?.dateOfBirth) {
    return <Redirect href="profile" />;
  } else if (isSignedIn && (!userData?.firstName || !userData?.dateOfBirth)) {
    return <Redirect href="welcome" />;
  } else {
    return <Redirect href="phone-number" />;
  }
};

export default Index;
