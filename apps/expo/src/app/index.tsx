import React from "react";
import { Redirect } from "expo-router";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";

const Index = () => {
  const { isLoading: sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: permissionsIsLoading } = usePermissions();

  if (sessionIsLoading || permissionsIsLoading) {
    return null;
  }

  return isSignedIn ? (
    <Redirect href="/(app)/(bottom-tabs)/(home)" />
  ) : (
    <Redirect href="/(onboarding)" />
  );
};

export default Index;
