import { useState } from "react";
import { Alert, Linking } from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { PermissionStatus } from "expo-media-library";

type SaveState = "idle" | "saving" | "saved";

const useSaveVideo = () => {
  const [saveState, setSaveState] = useState<SaveState>("idle");

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

  const downloadImage = async ({
    presignedUrl,
    fileName,
  }: {
    presignedUrl: string;
    fileName: string;
  }) => {
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    try {
      const { uri } = await FileSystem.downloadAsync(presignedUrl, fileUri); // Just gonna temporarily store in cache
      console.log("File downloaded to cache dir:", uri);

      await MediaLibrary.createAssetAsync(uri);
      // You can add additional logic here, like saving to the phone's gallery
      await FileSystem.deleteAsync(uri); // Delete that shit from cache
      return uri;
    } catch (error) {
      console.error("Error downloading file:", error);
      return null;
    }
  };

  const saveToCameraRoll = async ({
    uri,
    isNetworkUrl,
  }: {
    uri: string;
    isNetworkUrl: boolean;
  }) => {
    setSaveState("saving");

    const hasPermission = await requestMediaLibraryPermission();

    if (!hasPermission) {
      setSaveState("idle");
      return;
    }

    if (isNetworkUrl) {
      await downloadImage({
        presignedUrl: uri,
        fileName: "downloaded_image.jpg",
      });
      console.log("Downloaded image");
    } else {
      await MediaLibrary.createAssetAsync(uri);
      setSaveState("saved");
    }
  };

  return { saveState, saveToCameraRoll };
};

export default useSaveVideo;
