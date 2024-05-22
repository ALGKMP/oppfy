import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";

const Index = () => {
  const { isLoading: sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: permissionsIsLoading } = usePermissions();

  useEffect(() => {
    // When loading is complete, hide the splash screen
    if (!sessionIsLoading && !permissionsIsLoading) {
      void SplashScreen.hideAsync();
    }
  }, [sessionIsLoading, permissionsIsLoading]);

  if (sessionIsLoading || permissionsIsLoading) {
    return <LoadingIndicatorOverlay />;
  }

  return isSignedIn ? (
    <Redirect href="/(app)/(bottom-tabs)/self-profile/media-of-you" />
  ) : (
    <Redirect href="/(onboarding)" />
  );
};

export default Index;
