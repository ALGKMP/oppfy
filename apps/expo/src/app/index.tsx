import React from "react";
import { Redirect } from "expo-router";

import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

const Index = () => {
  const { isLoading: isLoadingAuth, isSignedIn } = useAuth();
  const { isLoading: isLoadingUserStatus, data: userStatus } =
    api.user.getUserStatus.useQuery(undefined, {
      enabled: isSignedIn && !isLoadingAuth,
    });

  const isLoading = isLoadingAuth || isLoadingUserStatus;

  if (isLoading) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!userStatus?.hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/user-info/name" />;
  }

  return <Redirect href="/(app)/(bottom-tabs)/(home)" />;
};

export default Index;
