import { Redirect } from "expo-router";

import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { usePushNotifications } from "~/hooks/notifications";
import { Stack } from "~/layouts";
import { api } from "~/utils/api";

const AppLayout = () => {
  usePushNotifications();
  // useContacts(true);

  const { isLoading: _sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: _permissionsIsLoading, permissions } = usePermissions();

  const { isLoading: onboardingCompleteIsLoading, data: onboardingComplete } =
    api.user.onboardingComplete.useQuery();
  const { isLoading: profileDataLoading, data: profileData } =
    api.profile.getFullProfileSelf.useQuery();

  const requiredPermissions = permissions.camera && permissions.contacts;

  if (onboardingCompleteIsLoading || profileDataLoading) {
    return <LoadingIndicatorOverlay />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (onboardingComplete === false) {
    return <Redirect href="/(onboarding)/user-info/welcome" />;
  }
  
  if (onboardingComplete === undefined) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!requiredPermissions) {
    return <Redirect href="/(onboarding)/misc/permissions" />;
  }

  // if (profileData && profileData.profileStats.posts < 3) {
  //   console.log("Routing TO POST GUIDE");
  //   return <Redirect href="/(locked)/invite" />;
  
  if (profileData && profileData.profileStats.posts < 0) {
    console.log("Routing TO POST GUIDE");
    return <Redirect href="/(locked)/invite" />;
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
