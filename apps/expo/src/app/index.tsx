import React from "react";
import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";
import { useContacts } from "~/hooks/contacts";

const Index = () => {
  const { isLoading: permissionsIsLoading } = usePermissions();
  const { isLoading: sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: onboardingCompleteIsLoading, data: onboardingComplete } =
    api.user.onboardingComplete.useQuery();
  const { syncContacts } = useContacts();

  const isLoading =
    sessionIsLoading || permissionsIsLoading || onboardingCompleteIsLoading;

  if (isLoading) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/user-info/name" />;
  }

  void syncContacts();

  return <Redirect href="/(app)/(bottom-tabs)/(home)" />;
};

export default Index;
