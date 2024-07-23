import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { useContacts } from "~/hooks/contacts";
import { usePushNotifications } from "~/hooks/notifications";
import { Stack } from "~/layouts";
import { api } from "~/utils/api";

const AppLayout = () => {
  usePushNotifications();
  useContacts(true);

  const { isLoading: _sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: _permissionsIsLoading, permissions } = usePermissions();

  const { isLoading: onboardingCompleteIsLoading, data: onboardingComplete } =
    api.user.onboardingComplete.useQuery();

  const requiredPermissions = permissions.camera && permissions.contacts;

  if (onboardingCompleteIsLoading) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!onboardingComplete) {
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
