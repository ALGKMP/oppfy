import { useCallback } from "react";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { FFmpegKit } from "ffmpeg-kit-react-native";

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface ProcessVideoOptions {
  uri: string;
  startTime: number;
  endTime: number;
  crop?: CropRegion;
}

interface ProcessPhotoOptions {
  uri: string;
  crop?: CropRegion;
}

const useMediaProcessing = () => {
  const processVideo = useCallback(
    async ({ uri, startTime, endTime, crop }: ProcessVideoOptions) => {
      const outputUri = `${FileSystem.cacheDirectory}processed_${Date.now()}.mp4`;

      let command = `-i "${uri}" -t ${endTime - startTime}`;

      if (startTime > 0) {
        command = `${command} -ss ${startTime}`;
      }

      if (crop) {
        // Add crop filter
        command = `${command} -vf "crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}"`;

        // Add rotation if needed
        if (crop.rotation !== 0) {
          command = `${command},rotate=${crop.rotation}`;
        }
      }

      // Ensure output is h264 for compatibility
      command = `${command} -c:v h264 -b:v 2M -c:a aac "${outputUri}"`;

      try {
        await FFmpegKit.execute(command);
        return outputUri;
      } catch (error) {
        console.error("Error processing video:", error);
        throw error;
      }
    },
    [],
  );

  const processPhoto = useCallback(
    async ({ uri, crop }: ProcessPhotoOptions) => {
      try {
        const actions: ImageManipulator.Action[] = [];

        if (crop) {
          // Add crop action
          actions.push({
            crop: {
              originX: crop.x,
              originY: crop.y,
              width: crop.width,
              height: crop.height,
            },
          });

          // Add rotation if needed
          if (crop.rotation !== 0) {
            actions.push({
              rotate: (crop.rotation / Math.PI) * 180,
            });
          }
        }

        const result = await ImageManipulator.manipulateAsync(uri, actions, {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        });

        return result.uri;
      } catch (error) {
        console.error("Error processing photo:", error);
        throw error;
      }
    },
    [],
  );

  return {
    processVideo,
    processPhoto,
  };
};

export default useMediaProcessing;
