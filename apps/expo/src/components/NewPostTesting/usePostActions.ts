import { Position } from "react-native-image-marker";
import { useRouter } from "expo-router";
import watermark from "@assets/watermark.png";
import { useToastController } from "@tamagui/toast";

import { useSession } from "~/contexts/SessionContext";
import { useRouteProfile } from "~/hooks/useRouteProfile";
import type { PostData as OtherPostProps } from "./ui/PostCard";
import { useSaveMedia } from "./useSaveMedia";

export const usePostActions = (postProps: OtherPostProps) => {
  const router = useRouter();
  const toast = useToastController();
  const { saveMedia, isSaving } = useSaveMedia();
  const { user } = useSession();
  const { routeProfile } = useRouteProfile();
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

  const handleShare = () => {
    // TODO: Implement sharing
  };

  const handleRecipientPress = () => {
    routeProfile({
      userId: postProps.recipient.id,
      username: postProps.recipient.username,
    });
  };

    const handleAuthorPress = () => {
      if (user?.uid === postProps.author.id) {
        router.push({
          pathname: "/self-profile",
        });
      } else {
        router.push({
          pathname: `/profile/[userId]`,
          params: {
            userId: postProps.author.id,
            username: postProps.author.username,
          },
        });
      }
    };
    

    return {
      handleSavePost,
      handleShare,
      handleRecipientPress,
      handleAuthorPress,
      isSaving,
    };
};
