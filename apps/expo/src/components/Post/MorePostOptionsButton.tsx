import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import { MoreHorizontal } from "@tamagui/lucide-icons";

import { useActionSheetController } from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";
import { useDeletePost } from "../../hooks/post/useDeletePost";
import { useReportPost } from "../../hooks/post/useReportPost";
import { useSaveMedia } from "~/hooks/post/useSaveMedia";

interface MorePostOptionsButtonProps {
  postId: string;
  recipientUserId: string;
  mediaUrl: string;
  style?: StyleProp<ViewStyle>;
}

const MorePostOptionsButton = ({
  mediaUrl,
  style = { position: "absolute", bottom: 15, right: 15 },
  postId,
  recipientUserId,
}: MorePostOptionsButtonProps) => {
  const { handleSavePost, isSaving } = useSaveMedia();
  const { handleDeletePost, isDeleting } = useDeletePost();
  const { handleReportPost } = useReportPost(postId);

  const { user } = useSession();

  const { show, hide } = useActionSheetController();

  const buttonOptionsOther = [
    {
      text: isSaving ? "Saving..." : "Save Post",
      onPress: () => void handleSavePost(mediaUrl),
    },
    {
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
      onPress: () => {
        hide();
        setTimeout(() => {
          console.log("Showing report post");
          show({
            title: "Report Post",
            titleProps: {
              color: "$red9",
            },
            buttonOptions: [
              {
                text: "Violent or abusive",
                textProps: { color: "$blue9" },
                onPress: () => void handleReportPost("Violent or abusive"),
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
                onPress: () => void handleReportPost("Suicide and self-harm"),
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
        }, 2000);
      },
    },
  ];

  const buttonOptionsSelf = [
    {
      text: isSaving ? "Saving" : "Save Post",
      textProps: {
        color: isSaving ? "$gray9" : undefined,
      },
      autoClose: false,
      disabled: isSaving,
      onPress: () => void handleSavePost(mediaUrl),
    },
    {
      text: "Delete Post",
      textProps: {
        color: "$red9",
      },
      disabled: isDeleting,
      onPress: () => void handleDeletePost(postId),
    },
  ];

  return (
    <TouchableOpacity
      hitSlop={20}
      style={style}
      onPress={() => {
        show({
          title: "More Options",
          buttonOptions:
            user?.uid === recipientUserId
              ? buttonOptionsSelf
              : buttonOptionsOther,
        });
      }}
    >
      <MoreHorizontal />
    </TouchableOpacity>
  );
};

export default MorePostOptionsButton;
