import { useEffect } from "react";
import { Redirect, SplashScreen } from "expo-router";

import { Stack } from "~/components/Layouts/Navigation";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useContacts } from "~/hooks/contacts";
import {
  useNotificationObserver,
  usePushNotifications,
} from "~/hooks/notifications";
import { useAuth } from "~/hooks/useAuth";

const DELAY_TO_HIDE_SPLASH_SCREEN = 250;

const AppLayout = () => {
  usePushNotifications();
  useNotificationObserver();

  const { syncContacts } = useContacts();

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

  useEffect(() => {
    void syncContacts();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
