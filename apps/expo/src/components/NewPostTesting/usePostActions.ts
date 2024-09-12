import type { PostData as OtherPostProps } from "./ui/PostCard";
import { useRouter } from "expo-router";
import { useSaveMedia } from "./useSaveMedia";
import { useToastController } from "@tamagui/toast";
import { Position } from "react-native-image-marker";
import watermark from "@assets/watermark.png";

export const usePostActions = (postProps: OtherPostProps) => {
  const router = useRouter();
  const toast = useToastController();
  const { saveMedia, isSaving } = useSaveMedia();

  const handleSavePost = async () => {
    await saveMedia(postProps.media.url, {
      image: watermark,
      position: Position.bottomRight,
      scale: 0.7,
    });
    toast.show("Post Saved");
  };

  const handleShare = () => {
    // TODO: Implement sharing
  };

  const handleRecipientPress = () => {
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: postProps.recipient.id,
        username: postProps.recipient.username,
      },
    });
  };

  const handleAuthorPress = () => {
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: postProps.author.id,
        username: postProps.author.username,
      },
    });
  };

  return {
    handleSavePost,
    handleShare,
    handleRecipientPress,
    handleAuthorPress,
    isSaving,
  };
};
