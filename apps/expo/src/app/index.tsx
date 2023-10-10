import React from "react";
import { Redirect } from "expo-router";
import auth from "@react-native-firebase/auth";


const Index = () => {
  const user = auth().currentUser;

  if (user && user.emailVerified) {
    return <Redirect href="profile" />;
  } else {
    return <Redirect href="auth/phone-number" />;
  }
};

export default Index;
