import { Redirect } from "expo-router";
import { View } from "tamagui";

import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { Stack } from "~/layouts";

const AppLayout = () => {
  const { isLoading: permissionsIsLoading, permissions } = usePermissions();
  const { isLoading: sessionIsLoading, isSignedIn } = useSession();

  const requiredPermissions =
    permissions.camera && permissions.contacts && permissions.notifications;

  if (sessionIsLoading || permissionsIsLoading) {
    return <LoadingIndicatorOverlay />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!requiredPermissions) {
    return <Redirect href="/(onboarding)/misc/permissions" />;
  }

  return (
    <View flex={1} backgroundColor="black">
      <Stack screenOptions={{ header: () => null }} />
    </View>
  );
};

export default AppLayout;
