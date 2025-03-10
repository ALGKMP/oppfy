import React from "react";
import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

const Index = () => {
  const { isLoading: isLoadingAuth, isSignedIn } = useAuth();
  const { isLoading: isLoadingUserStatus, data: userStatus } =
    api.user.getUserStatus.useQuery(undefined, {
      enabled: isSignedIn,
    });

  const { isLoading: isLoadingPermissions, permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  const isLoading =
    isLoadingAuth || isLoadingPermissions || isLoadingUserStatus;

  if (isLoading) {
    return null;
  }

  if (!isSignedIn || !requiredPermissions) {
    return <Redirect href="/(onboarding)" />;
  }

  if (userStatus !== undefined) {
    if (!userStatus.hasCompletedOnboarding) {
      return <Redirect href="/(onboarding)/user-info/name" />;
    }

    if (!userStatus.hasCompletedTutorial) {
      return <Redirect href="/(onboarding)/tutorial/intro" />;
    }
  }

  return <Redirect href="/(app)/(bottom-tabs)/(home)" />;
};

export default Index;
