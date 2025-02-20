import { useEffect } from "react";
import { SplashScreen, useRouter } from "expo-router";

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

  useEffect(() => void syncContacts(), []);

  useEffect(() => {
    if (isLoadingAuth || isLoadingPermissions) {
      return;
    }

    if (!isSignedIn || !requiredPermissions) {
      router.replace("/(onboarding)");
      return;
    }
  }, [
    isLoadingAuth,
    isLoadingPermissions,
    isSignedIn,
    requiredPermissions,
    router,
    syncContacts,
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
