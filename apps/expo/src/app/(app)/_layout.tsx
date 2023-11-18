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
import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionsContext";
import { Stack } from "~/layouts";

const AppLayout = () => {
  const { isLoading, isSignedIn } = useSession();
  const { permissions } = usePermissions();

  const requiredPermissions =
    permissions.camera && permissions.contacts && permissions.notifications;

  if (isLoading) {
    return <LoadingIndicatorOverlay />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!requiredPermissions) {
    return <Redirect href="/(onboarding)/permissions" />;
  }

  return (
    <View flex={1} backgroundColor="black">
      <Stack screenOptions={{ header: () => null }} />
    </View>
  );
};

export default AppLayout;
