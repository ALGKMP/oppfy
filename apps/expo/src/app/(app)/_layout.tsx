import React, { useEffect } from "react";
import { SplashScreen, useRouter } from "expo-router";

import { Stack } from "~/components/Layouts/Navigation";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useContacts } from "~/hooks/contacts";
import {
  useNotificationObserver,
  usePushNotifications,
} from "~/hooks/notifications";
import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

void SplashScreen.hideAsync();

const AppLayout = () => {
  usePushNotifications();
  useNotificationObserver();

  const router = useRouter();
  const { syncContacts } = useContacts();

  const { isLoading: isLoadingAuth, isSignedIn } = useAuth();

  const expireStreaksMutation = api.friend.expireInactiveStreaks.useMutation();

  useEffect(() => void syncContacts(), []);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isSignedIn) {
      router.replace("/(onboarding)");
      return;
    }
  }, [isLoadingAuth, isSignedIn, router, syncContacts]);

  useEffect(() => {
    // Expire inactive streaks when app opens
    const expireStreaks = async () => {
      try {
        const result = await expireStreaksMutation.mutateAsync();
        if (result.totalExpired > 0) {
          console.log(
            `App opened: Expired ${result.totalExpired} inactive streaks`,
          );
        }
      } catch (error) {
        console.log("Failed to expire streaks on app open:", String(error));
      }
    };

    void expireStreaks();
  }, []);

  return (
    <Stack
      initialRouteName="(bottom-tabs)"
      screenOptions={{
        header: () => null,
      }}
    />
  );
};

export default AppLayout;
