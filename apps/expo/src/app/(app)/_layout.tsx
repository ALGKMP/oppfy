import { useEffect } from "react";
import { Redirect, SplashScreen } from "expo-router";

import { Stack } from "~/components/Layouts/Navigation";
import { usePermissions } from "~/contexts/PermissionsContext";
import {
  useNotificationObserver,
  usePushNotifications,
} from "~/hooks/notifications";
import { useAuth } from "~/hooks/useAuth";

const DELAY_TO_HIDE_SPLASH_SCREEN = 250;

const AppLayout = () => {
  usePushNotifications();
  useNotificationObserver();
  // useContacts(true);

  const { isLoading: sessionIsLoading, isSignedIn } = useAuth();
  const { isLoading: permissionsIsLoading, permissions } = usePermissions();

  const requiredPermissions = permissions.camera && permissions.contacts;

  useEffect(() => {
    if (!sessionIsLoading && !permissionsIsLoading) {
      void setTimeout(
        () => void SplashScreen.hideAsync(),
        DELAY_TO_HIDE_SPLASH_SCREEN,
      );
    }
  }, [sessionIsLoading, permissionsIsLoading]);

  if (sessionIsLoading || permissionsIsLoading) {
    return null;
  }

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
      initialRouteName="(bottom-tabs)"
      screenOptions={{
        header: () => null,
      }}
    />
  );
};

export default AppLayout;
