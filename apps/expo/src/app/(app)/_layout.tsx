import { useEffect } from "react";
import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { usePushNotifications } from "~/hooks/notifications";
import { Stack } from "~/layouts";
import { api } from "~/utils/api";

const AppLayout = () => {
  usePushNotifications();

  const { isLoading: _sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: _permissionsIsLoading, permissions } = usePermissions();
  const onBoardingComplete = api.user.checkOnboardingComplete;

  const requiredPermissions = permissions.camera && permissions.contacts;

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!onBoardingComplete) {
    return <Redirect href="/(onboarding)/user-info/welcome" />;
  }

  if (!requiredPermissions) {
    return <Redirect href="/(onboarding)/misc/permissions" />;
  }

  return (
    <Stack
      screenOptions={{
        header: () => null,
      }}
    />
  );
};

export default AppLayout;
