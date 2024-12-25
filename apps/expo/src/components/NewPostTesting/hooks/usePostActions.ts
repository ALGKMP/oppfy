import { Position } from "react-native-image-marker";
import { useRouter } from "expo-router";
import watermark from "@assets/watermark.png";
import { useToastController } from "@tamagui/toast";

import type { PostData as OtherPostProps } from "../ui/PostCard";
import { useSaveMedia } from "./useSaveMedia";

export const usePostActions = (postProps: OtherPostProps) => {
  const toast = useToastController();
  const { saveMedia, isSaving } = useSaveMedia();
  const handleSavePost = async () => {
    try {
      await saveMedia(postProps.media.url, {
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

  return {
    handleSavePost,
    isSaving,
  };
};
