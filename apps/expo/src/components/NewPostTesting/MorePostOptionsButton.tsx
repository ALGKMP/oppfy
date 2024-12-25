import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import Haptics from "expo-haptics";
import { MoreHorizontal } from "@tamagui/lucide-icons";

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
  const { handleSavePost, isSaving } = useSaveMedia();

  const { show } = useActionSheetController();
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
              onPress: () => void handleSavePost(mediaUrl),
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
