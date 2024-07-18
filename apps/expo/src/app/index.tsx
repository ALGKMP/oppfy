import React, { useEffect } from "react";
import { Redirect, SplashScreen } from "expo-router";

import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";

const Index = () => {
  const { isLoading: sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: permissionsIsLoading } = usePermissions();

  useEffect(() => {
    // todo: to remove the black flicker at the start of the app, we need to hide the splash screen on their respective screens not on the initial app load
    // When loading is complete, hide the splash screen
    if (!sessionIsLoading && !permissionsIsLoading) {
      void SplashScreen.hideAsync();
    }
  }, [sessionIsLoading, permissionsIsLoading]);

  if (sessionIsLoading || permissionsIsLoading) {
    return <LoadingIndicatorOverlay />;
  }

  return isSignedIn ? (
    <Redirect href="/(app)/(bottom-tabs)/(profile)/self-profile" />
  ) : (
    <Redirect href="/(onboarding)" />
  );
};

export default Index;
