import React from "react";
import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

const Index = () => {
  const { isLoading: permissionsIsLoading } = usePermissions();
  const { isLoading: sessionIsLoading, isSignedIn } = useAuth();
  const { isLoading: onboardingCompleteIsLoading, data: onboardingComplete } =
    api.user.onboardingComplete.useQuery();
  const { isLoading: tutorialCompleteIsLoading, data: tutorialComplete } =
    api.user.tutorialComplete.useQuery();

  const isLoading =
    sessionIsLoading ||
    permissionsIsLoading ||
    onboardingCompleteIsLoading ||
    tutorialCompleteIsLoading;

  if (isLoading) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/user-info/name" />;
  }

  if (!tutorialComplete) {
    return <Redirect href="/(onboarding)/tutorial/intro" />;
  }

  return <Redirect href="/(app)/(bottom-tabs)/(home)" />;
};

export default Index;
