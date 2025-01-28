import React, { useEffect, useState } from "react";
import * as Updates from "expo-updates";
import { Button, Dialog, YStack, Text } from "tamagui";

export const UpdateHandler = () => {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setShowUpdateDialog(true);
      }
    } catch (error) {
      console.log('Error checking for updates:', error);
    }
  };

  const downloadAndReload = async () => {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (error) {
      console.log('Error downloading update:', error);
    }
  };

  useEffect(() => {
    void checkForUpdates();
  }, []);

  return (
    <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
        >
          <YStack space="$4">
            <Dialog.Title>Update Available</Dialog.Title>
            <Dialog.Description>
              A new version of Oppfy is available. Please update to continue using the app.
            </Dialog.Description>

            <YStack space="$2">
              <Button
                theme="active"
                onPress={downloadAndReload}
              >
                Update Now
              </Button>
            </YStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};