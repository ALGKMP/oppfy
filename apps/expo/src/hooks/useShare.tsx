import { useState } from "react";
import { Alert } from "react-native";
import * as Sharing from "expo-sharing";

import useSaveMedia from "./useSaveMedia";

const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const { deleteCachedMedia, cacheMediaWithWatermark } = useSaveMedia();

  const shareImage = async ({ uri }: { uri: string }) => {
    setIsSharing(true);
    try {
      const processesedUri = await cacheMediaWithWatermark({
        presignedUrl: uri,
        fileName: "shared_image",
        mediaType: "image",
      });

      if (!processesedUri) {
        throw new Error("Failed to cache image file");
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(processesedUri, {
          dialogTitle: "Share to...",
        });
      } else {
        Alert.alert("Sharing is not available on your device");
      }
      await deleteCachedMedia(processesedUri);
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("An error occurred while sharing the image");
    }
    setIsSharing(false);
  };

  return { isSharing, shareImage };
};

export default useShare;
