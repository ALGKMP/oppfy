import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { Stack } from "~/layouts";

const AppLayout = () => {
  const { isLoading: _permissionsIsLoading, permissions } = usePermissions();
  const { isLoading: _sessionIsLoading, isSignedIn } = useSession();

  const requiredPermissions = permissions.camera && permissions.contacts;

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
      }}
    />
  );
};

export default AppLayout;
