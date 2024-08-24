import { useEffect } from "react";
import { Redirect, SplashScreen } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import {
  useNotificationObserver,
  usePushNotifications,
} from "~/hooks/notifications";
import { Stack } from "~/layouts";

const DELAY_TO_HIDE_SPLASH_SCREEN = 250;

const AppLayout = () => {
  usePushNotifications();
  useNotificationObserver();
  // useContacts(true);

  const { isLoading: _sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: _permissionsIsLoading, permissions } = usePermissions();

  const requiredPermissions = permissions.camera && permissions.contacts;

  useEffect(() => {
    void setTimeout(
      () => void SplashScreen.hideAsync(),
      DELAY_TO_HIDE_SPLASH_SCREEN,
    );
  }, []);

  if (!isSignedIn) {
    console.log("!isSignedIn");
    return <Redirect href="/(onboarding)" />;
  }

  if (!requiredPermissions) {
    console.log("!requiredPermissions");
    return <Redirect href="/(onboarding)/misc/permissions" />;
  }

  // if (profileData && profileData.profileStats.posts < 0) {
  //   return <Redirect href="/(locked)/invite" />;
  // }

  return (
    <Stack
      screenOptions={{
        header: () => null,
      }}
    />
  );
};

export default AppLayout;
