import { Pressable } from "react-native";
import { Redirect, useRouter } from "expo-router";
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

import useSession from "~/hooks/useSession";
import { BottomTabs, Stack } from "~/layouts";

const AppLayout = () => {
  const { isLoading, user } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  return <Stack />;
};

export default AppLayout;
