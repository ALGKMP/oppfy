import React from "react";
import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

const Index = () => {
  const { isLoading: isLoadingAuth, isSignedIn } = useAuth();
  const { isLoading: isLoadingOnboardingComplete, data: onboardingComplete } =
    api.user.onboardingComplete.useQuery();
  const { isLoading: isLoadingTutorialComplete, data: tutorialComplete } =
    api.user.tutorialComplete.useQuery();

  const { isLoading: isLoadingPermissions, permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  const isLoading =
    isLoadingAuth ||
    isLoadingPermissions ||
    isLoadingTutorialComplete ||
    isLoadingOnboardingComplete;

  if (isLoading) {
    return null;
  }

  if (!isSignedIn || !requiredPermissions) {
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
