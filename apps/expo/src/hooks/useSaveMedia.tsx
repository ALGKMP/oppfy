import { useState } from "react";
import { Alert, Linking } from "react-native";
import Marker, { Position } from "react-native-image-marker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { PermissionStatus } from "expo-media-library";
import watermark from "@assets/watermark.png";

type SaveState = "idle" | "saving" | "saved";
type MediaType = "image" | "video";

const useSaveMedia = () => {
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const addWatermark = async (imageUri: string) => {
    try {
      console.log("imageUri", imageUri);
      const result = await Marker.markImage({
        backgroundImage: {
          src: imageUri,
          scale: 1,
        },
        watermarkImages: [
          {
            src: watermark,
            position: {
              position: Position.bottomRight,
            },
          },
        ],
      });

      return result;
    } catch (error) {
      console.error("Error adding watermark:", error);
      return null;
    }
  };

  const openSettings = async () => {
    await Linking.openSettings();
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === PermissionStatus.GRANTED) {
      return true;
    }

    Alert.alert(
      "Media Library Permission",
      "Media library permission is required for this app. Please enable it in your device settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: void openSettings },
      ],
    );

    return false;
  };

  const cacheMedia = async ({
    presignedUrl,
    fileName,
    mediaType,
  }: {
    presignedUrl: string;
    fileName: string;
    mediaType: MediaType;
  }) => {
    const playbackId = await extractPlayback(presignedUrl);
    if (mediaType == "video") {
      presignedUrl = `https://stream.mux.com/${playbackId}/standard.mp4`;
    }

    const fileExtension = mediaType === "image" ? "jpg" : "mp4";
    const fileUri = `${FileSystem.cacheDirectory}${fileName}.${fileExtension}`;

    try {
      const { uri, mimeType, headers, status } = await FileSystem.downloadAsync(
        presignedUrl,
        fileUri,
      );
      return uri;
    } catch (error) {
      console.error("Error downloading file:", error);
      return null;
    }
  };

  const cacheMediaWithWatermark = async ({
    presignedUrl,
    fileName,
    mediaType,
  }: {
    presignedUrl: string;
    fileName: string;
    mediaType: MediaType;
  }) => {
    const cachedUri = await cacheMedia({ presignedUrl, fileName, mediaType });
    if (!cachedUri) {
      return null;
    }
    return await addWatermark(cachedUri);
  };

  const deleteCachedMedia = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const cleanupCacheDirectory = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        console.log("Cache directory not available");
        return;
      }

      const contents = await FileSystem.readDirectoryAsync(cacheDir);

      for (const item of contents) {
        const itemPath = `${cacheDir}${item}`;
        try {
          await FileSystem.deleteAsync(itemPath, { idempotent: true });
          // console.log(`Deleted: ${itemPath}`);
        } catch (error) {
          console.error(`Error deleting ${itemPath}:`, error);
        }
      }

    } catch (error) {
      console.error("Error cleaning up cache directory:", error);
    }
  };

  const downloadMedia = async ({
    presignedUrl,
    fileName,
    mediaType,
  }: {
    presignedUrl: string;
    fileName: string;
    mediaType: MediaType;
  }) => {
    const playbackId = await extractPlayback(presignedUrl);

    if (mediaType == "video") {
      presignedUrl = `https://stream.mux.com/${playbackId}/standard.mp4`;
    }

    const fileExtension = mediaType === "image" ? "jpg" : "mp4";
    const fileUri = `${FileSystem.cacheDirectory}${fileName}.${fileExtension}`;

    try {
      const { uri } = await FileSystem.downloadAsync(presignedUrl, fileUri);
      console.log("File downloaded to cache dir:", uri);

      if (mediaType === "image") {
        const watermarkedUri = await addWatermark(uri);
        if (watermarkedUri) {
          await MediaLibrary.createAssetAsync(watermarkedUri);
          await FileSystem.deleteAsync(watermarkedUri);
        } else {
          await MediaLibrary.createAssetAsync(uri);
        }
      } else {
        await MediaLibrary.createAssetAsync(uri);
      }
      await FileSystem.deleteAsync(uri);
      return uri;
    } catch (error) {
      console.error("Error downloading file:", error);
      return null;
    }
  };

  const saveToCameraRoll = async ({
    uri,
    isNetworkUrl,
    mediaType,
  }: {
    uri: string;
    isNetworkUrl: boolean;
    mediaType: MediaType;
  }) => {
    setSaveState("saving");

    const hasPermission = await requestMediaLibraryPermission();

    if (!hasPermission) {
      setSaveState("idle");
      return;
    }

    try {
      if (isNetworkUrl) {
        await downloadMedia({
          presignedUrl: uri,
          fileName: `downloaded_${mediaType}`,
          mediaType,
        });
        console.log(`Downloaded ${mediaType}`);
      } else {
        await MediaLibrary.createAssetAsync(uri);
      }
      setSaveState("saved");
    } catch (error) {
      console.error(`Error saving ${mediaType}:`, error);
      setSaveState("idle");
    }
  };

  const extractPlayback = async (uri: string) => {
    const regex = /mux\.com\/([a-zA-Z0-9]+)\./;
    const match = uri.match(regex);
    if (match) {
      return match[1];
    } else {
      return null;
    }
  };

  return {
    saveState,
    addWatermark,
    saveToCameraRoll,
    cacheMedia,
    cacheMediaWithWatermark,
    deleteCachedMedia,
    cleanupCacheDirectory,
  };
};

export default useSaveMedia;
