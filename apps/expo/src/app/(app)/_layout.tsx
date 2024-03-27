import { useEffect } from "react";
import { Pressable } from "react-native";
import { Redirect, Slot, useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
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

import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionsContext";
import { Stack } from "~/layouts";
import { api } from "~/utils/api";

const AppLayout = () => {
  const { permissions } = usePermissions();
  const { isLoading: sessionIsLoading, isSignedIn } = useSession();

  const { isLoading: userIsLoading, data: user } = api.auth.getUser.useQuery();

  const requiredPermissions =
    permissions.camera && permissions.contacts && permissions.notifications;

  useEffect(() => {
    if (!userIsLoading) {
      void SplashScreen.hideAsync();
    }
  }, [userIsLoading]);

  if (sessionIsLoading || userIsLoading) {
    return <LoadingIndicatorOverlay />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!user?.name || !user?.dateOfBirth) {
    return <Redirect href="/(onboarding)/user-info/welcome" />;
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
