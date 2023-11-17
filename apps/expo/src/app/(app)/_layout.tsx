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
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionsContext";
import { Stack } from "~/layouts";

const AppLayout = () => {
  const { isLoading, isSignedIn } = useSession();
  const { permissions } = usePermissions();

  const allPermissions = Object.values(permissions).every((p) => p === true);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!isSignedIn) {
    console.log("NOT SIGNED IN");
    return <Redirect href="/(auth)/phone-number" />;
  }

  if (!allPermissions) {
    console.log("NOT ALL PERMISSIONS");
    return <Redirect href="/(permissions)" />;
  }

  return <Stack screenOptions={{ header: () => null }} />;
};

export default AppLayout;
