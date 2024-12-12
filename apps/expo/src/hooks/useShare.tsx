import { useState } from "react";
import { Alert } from "react-native";
import * as Sharing from "expo-sharing";

import useSaveMedia from "./useSaveMedia";

interface ShareOptions {
  uri?: string;
  url?: string;
  title?: string;
  message?: string;
}

const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const { deleteCachedMedia, cacheMediaWithWatermark } = useSaveMedia();

  const share = async ({ uri, url, title, message }: ShareOptions) => {
    setIsSharing(true);
    try {
      if (uri) {
        const processedUri = await cacheMediaWithWatermark({
          presignedUrl: uri,
          fileName: "shared_image",
          mediaType: "image",
        });

        if (!processedUri) {
          throw new Error("Failed to cache image file");
        }

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(processedUri, {
            dialogTitle: title ?? "Share to...",
          });
        } else {
          Alert.alert("Sharing is not available on your device");
        }
        await deleteCachedMedia(processedUri);
      } 
      else if (url) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(url, {
            dialogTitle: title ?? "Share to...",
            mimeType: 'text/plain',
            UTI: 'public.plain-text',
          });
        } else {
          Alert.alert("Sharing is not available on your device");
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("An error occurred while sharing");
    }
    setIsSharing(false);
  };

  return { isSharing, share };
};

export default useShare;
