import { useState } from "react";
import type { ImageSourcePropType } from "react-native";
import ImageMarker, { Position } from "react-native-image-marker";
import * as MediaLibrary from "expo-media-library";

interface WatermarkOptions {
  image: ImageSourcePropType | string;
  position?: Position;
  scale?: number;
}

export const useSaveMedia = () => {
  const [isSaving, setIsSaving] = useState(false);

  const saveMedia = async (
    mediaUrl: string,
    watermark?: WatermarkOptions | undefined,
  ) => {
    setIsSaving(true);

    await ensurePermissions();

    const manipulatedImage = watermark
      ? await addWatermark(mediaUrl, watermark)
      : mediaUrl;
    await MediaLibrary.saveToLibraryAsync(manipulatedImage);

    setIsSaving(false);
  };

  return { saveMedia, isSaving };
};

const ensurePermissions = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== MediaLibrary.PermissionStatus.GRANTED) {
    throw new Error("Media library permission not granted");
  }
};

const addWatermark = async (mediaUrl: string, watermark: WatermarkOptions) => {
  return ImageMarker.markImage({
    backgroundImage: { src: mediaUrl, scale: 1 },
    watermarkImages: [
      {
        src: watermark,
        position: {
          position: watermark.position ?? Position.bottomRight,
        },
        scale: watermark.scale ?? 1,
      },
    ],
  });
};
