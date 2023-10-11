import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import auth from "@react-native-firebase/auth";
import { useSession } from "~/contexts/SessionsContext";
import { Text } from "tamagui";


const Index = () => {
  const { isSignedIn, isLoading, signOut } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (isSignedIn) {
    console.log("USER IS SIGNED IN");
    
    return <Redirect href="profile" />;
  } else {
    console.log("USER IS NOT SIGNED IN");

    return <Redirect href="auth/phone-number" />;
  }
};

export default Index;
