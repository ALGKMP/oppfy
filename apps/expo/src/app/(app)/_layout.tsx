import { Redirect } from "expo-router";
import { useTheme, View } from "tamagui";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { Stack } from "~/layouts";

const AppLayout = () => {
  const theme = useTheme();

  const { isLoading: _permissionsIsLoading, permissions } = usePermissions();
  const { isLoading: _sessionIsLoading, isSignedIn } = useSession();

  const requiredPermissions =
    permissions.camera && permissions.contacts && permissions.notifications;

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!requiredPermissions) {
    return <Redirect href="/(onboarding)/misc/permissions" />;
  }

  return (
    <Stack
      screenOptions={{
        header: () => null,
        contentStyle: {
          backgroundColor: theme.background.val,
        },
      }}
    />
  );
};

export default AppLayout;
