import { useState } from "react";
import { Alert, Linking } from "react-native";
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

  const saveToCameraRoll = async ({ uri }: { uri: string }) => {
    setSaveState("saving");

    const hasPermission = await requestMediaLibraryPermission();

    if (!hasPermission) {
      setSaveState("idle");
      return;
    }

    await MediaLibrary.createAssetAsync(uri);
    setSaveState("saved");
  };

  return { saveState, saveToCameraRoll };
};

export default useSaveVideo;
