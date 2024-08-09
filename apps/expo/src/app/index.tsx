import React from "react";
import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

const Index = () => {
  const { isLoading: permissionsIsLoading } = usePermissions();
  const { isLoading: sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: onboardingCompleteIsLoading, data: onboardingComplete } =
    api.user.onboardingComplete.useQuery();

  if (sessionIsLoading || permissionsIsLoading || onboardingCompleteIsLoading) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/user-info/welcome" />;
  }

  return <Redirect href="/(app)/(bottom-tabs)/(home)" />;
};

export default Index;
