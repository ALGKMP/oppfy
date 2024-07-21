import React, { useEffect } from "react";
import { Redirect, SplashScreen } from "expo-router";

import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import useSaveMedia from "~/hooks/useSaveMedia";

const Index = () => {
  const { isLoading: sessionIsLoading, isSignedIn } = useSession();
  const { isLoading: permissionsIsLoading } = usePermissions();
  const { cleanupCacheDirectory } = useSaveMedia();

  useEffect(() => {
    async function prepare() {
      try {
        // Perform cache cleanup
        await cleanupCacheDirectory();

        // Wait for session and permissions to load
        while (sessionIsLoading || permissionsIsLoading) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // When loading is complete, hide the splash screen
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error("Error during app initialization:", e);
      }
    }

    void prepare();
  }, [sessionIsLoading, permissionsIsLoading, cleanupCacheDirectory]);

  if (sessionIsLoading || permissionsIsLoading) {
    return <LoadingIndicatorOverlay />;
  }

  return isSignedIn ? (
    <Redirect href="/(app)/(bottom-tabs)/(home)/home" />
  ) : (
    <Redirect href="/(onboarding)" />
  );
};

export default Index;
