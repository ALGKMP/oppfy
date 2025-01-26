import { useEffect } from "react";
import { Redirect, SplashScreen, useRouter } from "expo-router";

import { Stack } from "~/components/Layouts/Navigation";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useContacts } from "~/hooks/contacts";
import {
  useNotificationObserver,
  usePushNotifications,
} from "~/hooks/notifications";
import { useAuth } from "~/hooks/useAuth";

void SplashScreen.hideAsync();

const AppLayout = () => {
  usePushNotifications();
  useNotificationObserver();

  const router = useRouter();
  const { syncContacts } = useContacts();

  const { isLoading: isLoadingAuth, isSignedIn } = useAuth();
  const { isLoading: isLoadingPermissions, permissions } = usePermissions();

  const requiredPermissions = permissions.camera && permissions.contacts;

  useEffect(() => {
    void syncContacts();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoadingAuth || isLoadingPermissions) {
      return;
    }

    if (!isSignedIn) {
      router.replace("/(onboarding)");
      return;
    }

    if (!requiredPermissions) {
      router.push("/(onboarding)/misc/permissions");
      return;
    }
  }, [
    isLoadingAuth,
    isLoadingPermissions,
    isSignedIn,
    requiredPermissions,
    router,
  ]);

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
