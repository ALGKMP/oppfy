import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import { Position } from "react-native-image-marker";
import Haptics from "expo-haptics";
import watermark from "@assets/watermark.png";
import { MoreHorizontal } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";

import { useActionSheetController } from "~/components/ui";
import { useSaveMedia } from "./hooks/useSaveMedia";

interface MorePostOptionsButtonProps {
  mediaUrl: string;
  style?: StyleProp<ViewStyle>;
}

const MorePostOptionsButton = ({
  mediaUrl,
  style = { position: "absolute", bottom: 15, right: 15 },
}: MorePostOptionsButtonProps) => {
  const { saveMedia, isSaving } = useSaveMedia();

  const { show } = useActionSheetController();
  const toast = useToastController();

  const handleSavePost = async () => {
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
  return (
    <TouchableOpacity
      hitSlop={20}
      style={style}
      onPress={() => {
        // void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        show({
          title: "More Options",
          buttonOptions: [
            {
              text: isSaving ? "Saving..." : "Save Post",
              onPress: handleSavePost,
            },
            { text: "Report Post", onPress: () => {} },
          ],
        });
      }}
    >
      <MoreHorizontal />
    </TouchableOpacity>
  );
};

export default MorePostOptionsButton;
