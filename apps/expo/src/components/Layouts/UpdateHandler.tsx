import { useEffect } from "react";
import * as Updates from "expo-updates";

import { useDialogController } from "~/components/ui";

export const UpdateHandler = () => {
  const dialog = useDialogController();

  const checkForUpdates = async () => {
    if (__DEV__) return; // Skip update check in development

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await dialog.show({
          title: "Update Available",
          subtitle:
            "A new version of Oppfy is available. Please update to continue using the app.",
          acceptText: "Update Now",
          onAccept: () => void downloadAndReload,
        });
      }
    } catch (error) {
      console.log("Error checking for updates:", error);
    }
  };

  const downloadAndReload = async () => {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (error) {
      console.log("Error downloading update:", error);
    }
  };

  useEffect(() => {
    void checkForUpdates();
  }, []);

  return null;
};
