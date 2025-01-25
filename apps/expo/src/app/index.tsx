import React from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useContacts } from "~/hooks/contacts";
import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

const Index = () => {
  const { isLoading: permissionsIsLoading } = usePermissions();
  const { isLoading: sessionIsLoading, isSignedIn } = useAuth();
  const { isLoading: onboardingCompleteIsLoading, data: onboardingComplete } =
    api.user.onboardingComplete.useQuery();
  const { syncContacts } = useContacts();

  const isLoading =
    sessionIsLoading || permissionsIsLoading || onboardingCompleteIsLoading;

  console.log("isLoadingIndex", isLoading);

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
