import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import Haptics from "expo-haptics";
import { MoreHorizontal } from "@tamagui/lucide-icons";

import { useActionSheetController } from "~/components/ui";
import { useReportPost } from "./hooks/useReportPost";
import { useSaveMedia } from "./hooks/useSaveMedia";

interface MorePostOptionsButtonProps {
  postId: string;
  mediaUrl: string;
  style?: StyleProp<ViewStyle>;
}

const MorePostOptionsButton = ({
  mediaUrl,
  style = { position: "absolute", bottom: 15, right: 15 },
  postId,
}: MorePostOptionsButtonProps) => {
  const { handleSavePost, isSaving } = useSaveMedia();
  const { handleReportPost } = useReportPost(postId);

  const { show, hide } = useActionSheetController();

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
            {
              text: "Report Post",
              onPress: () => {
                // hide();
                setTimeout(() => {
                  show({
                    title: "Report Post",
                    buttonOptions: [
                    {
                      text: "Violent or abusive",
                      textProps: { color: "$blue9" },
                      onPress: () =>
                        void handleReportPost("Violent or abusive"),
                    },
                    {
                      text: "Sexually explicit or predatory",
                      textProps: { color: "$blue9" },
                      onPress: () =>
                        void handleReportPost("Sexually explicit or predatory"),
                    },
                    {
                      text: "Hate, harassment, or bullying",
                      textProps: { color: "$blue9" },
                      onPress: () =>
                        void handleReportPost("Hate, harassment or bullying"),
                    },
                    {
                      text: "Suicide and self-harm",
                      textProps: { color: "$blue9" },
                      onPress: () =>
                        void handleReportPost("Suicide and self-harm"),
                    },
                    {
                      text: "Scam or spam",
                      textProps: { color: "$blue9" },
                      onPress: () => void handleReportPost("Spam or scam"),
                    },
                    {
                      text: "Other",
                      textProps: { color: "$blue9" },
                      onPress: () => void handleReportPost("Other"),
                    },
                  ],
                  });
                }, 4000);
              },
            },
          ],
        });
      }}
    >
      <MoreHorizontal />
    </TouchableOpacity>
  );
};

export default MorePostOptionsButton;
