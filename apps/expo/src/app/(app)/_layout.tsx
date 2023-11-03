import { Pressable } from "react-native";
import { Redirect, Slot, useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { getTokens } from "@tamagui/core";
import {
  Camera,
  Home,
  Inbox,
  MoreHorizontal,
  Search,
  User2,
} from "@tamagui/lucide-icons";
import { Button, Text, View, XStack } from "tamagui";

import { api } from "~/utils/api";
import { useSession } from "~/contexts/SessionsContext";
import { Stack } from "~/layouts";

const AppLayout = () => {
  const { isLoading, isSignedIn } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!isSignedIn) {
    console.log("NOT SIGNED IN");
    return <Redirect href="/(auth)/phone-number" />;
  }

  return <Slot />;
};

export default AppLayout;
