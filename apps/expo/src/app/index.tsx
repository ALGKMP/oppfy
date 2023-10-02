import React, { useState } from "react";
import { ImageBackground, Pressable } from "react-native";
import { Redirect, useRouter } from "expo-router";
import Tinder from "@assets/tinder.png";
import auth from "@react-native-firebase/auth";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Button, Text, View, YStack } from "tamagui";

import { api } from "~/utils/api";

const Index = () => {
  const user = auth().currentUser;

  if (user && user.emailVerified) {
    return <Redirect href="profile" />;
  } else {
    return <Redirect href="auth-welcome" />;
  }
};

export default Index;
