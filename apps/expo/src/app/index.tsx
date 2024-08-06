import React, { useEffect } from "react";
import { Redirect, SplashScreen } from "expo-router";

import { LoadingIndicatorOverlay } from "~/components/Overlays";
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
