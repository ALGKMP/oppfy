import { useState } from "react";
import type { ImageSourcePropType } from "react-native";
import Marker, { Position } from "react-native-image-marker";
import { randomUUID } from "expo-crypto";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useToastController } from "@tamagui/toast";
import watermark from "@assets/watermark.png";

interface WatermarkOptions {
  image: ImageSourcePropType | string;
  position?: Position;
  scale?: number;
}

export const useSaveMedia = () => {
  const toast = useToastController();
  const [isSaving, setIsSaving] = useState(false);

  const addWatermark = async (
    mediaUrl: string,
    watermark: WatermarkOptions,
  ) => {
    const fileUri =
      FileSystem.cacheDirectory + "temp_image" + randomUUID() + ".jpg";
    await FileSystem.downloadAsync(mediaUrl, fileUri);

    const markedImage = await Marker.markImage({
      backgroundImage: { src: fileUri, scale: 1 },
      watermarkImages: [
        {
          src: watermark.image,
          position: {
            position: watermark.position ?? Position.bottomRight,
          },
          scale: watermark.scale,
        },
      ],
    });

    await FileSystem.deleteAsync(fileUri);

    return markedImage;
  };

  const saveMedia = async (
    mediaUrl: string,
    watermark?: WatermarkOptions | undefined,
  ) => {
    setIsSaving(true);

    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status !== MediaLibrary.PermissionStatus.GRANTED) {
      setIsSaving(false);
      throw new Error("Media library permission not granted");
    }

    const manipulatedImage = watermark
      ? await addWatermark(mediaUrl, watermark)
      : mediaUrl;
    await MediaLibrary.saveToLibraryAsync(manipulatedImage);

    setIsSaving(false);
  };

  const handleSavePost = async (mediaUrl: string) => {
    try {
      await saveMedia(mediaUrl, {
        image: watermark,
        position: Position.bottomRight,
        scale: 0.7,
      });
      toast.show("Post Saved");
    } catch (error) {
      toast.show("Enable media library permission in settings", {
        burntOptions: {
          preset: "error",
        },
      });
    }
  };

  return { saveMedia, isSaving, handleSavePost };
};
