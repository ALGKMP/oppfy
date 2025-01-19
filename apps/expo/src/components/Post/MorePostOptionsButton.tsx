import type { StyleProp, ViewStyle } from "react-native";
import { TouchableOpacity } from "react-native";
import { MoreHorizontal } from "@tamagui/lucide-icons";

import {
  Icon,
  useActionSheetController,
  useAlertDialogController,
} from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";
import { useSaveMedia } from "~/hooks/post/useSaveMedia";
import { useDeletePost } from "../../hooks/post/useDeletePost";
import { useReportPost } from "../../hooks/post/useReportPost";
import { Author, Recipient } from "./PostCard";

interface MorePostOptionsButtonProps {
  postId: string;
  author: Author;
  recipient: Recipient;
  mediaUrl: string;
}

const MorePostOptionsButton = ({
  mediaUrl,
  postId,
  author,
  recipient,
}: MorePostOptionsButtonProps) => {
  const { handleSavePost, isSaving } = useSaveMedia();
  const { handleDeletePost, isDeleting } = useDeletePost();
  const { handleReportPost } = useReportPost(postId);

  const { user } = useSession();
  const { show: showAlert } = useAlertDialogController();
  const { show, hide } = useActionSheetController();

  const buttonOptionsOther = [
    {
      text: "Save Post",
      onPress: () => void handleSavePost(mediaUrl),
      autoClose: true,
    },
    {
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
      onPress: () => {
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
              autoClose: true,
            },
            {
              text: "Sexually explicit or predatory",
              textProps: { color: "$blue9" },
              onPress: () =>
                void handleReportPost("Sexually explicit or predatory"),
              autoClose: true,
            },
            {
              text: "Hate, harassment, or bullying",
              textProps: { color: "$blue9" },
              onPress: () =>
                void handleReportPost("Hate, harassment or bullying"),
              autoClose: true,
            },
            {
              text: "Suicide and self-harm",
              textProps: { color: "$blue9" },
              onPress: () => void handleReportPost("Suicide and self-harm"),
              autoClose: true,
            },
            {
              text: "Scam or spam",
              textProps: { color: "$blue9" },
              onPress: () => void handleReportPost("Spam or scam"),
              autoClose: true,
            },
            {
              text: "Other",
              textProps: { color: "$blue9" },
              onPress: () => void handleReportPost("Other"),
              autoClose: true,
            },
          ],
        });
      },
      autoClose: false,
    },
  ];

  const buttonOptionsSelf = [
    {
      text: isSaving ? "Saving..." : "Save Post",
      textProps: {
        color: isSaving ? "$gray9" : undefined,
      },
      disabled: isSaving,
      onPress: () => void handleSavePost(mediaUrl),
      autoClose: true,
    },
    {
      text: "Delete Post",
      textProps: {
        color: "$red9",
      },
      disabled: isDeleting,
      onPress: async () => {
        hide();
        const shouldDelete = await showAlert({
          title: "Delete Post",
          subtitle:
            "Are you sure you want to delete this post? This action cannot be undone.",
          acceptText: "Delete",
          cancelText: "Cancel",
        });

        if (shouldDelete) {
          void handleDeletePost(postId);
        }
      },
      autoClose: false,
    },
  ];

  return (
    <Icon
      name="ellipsis-horizontal"
      onPress={() => {
        show({
          title: "More Options",
          buttonOptions:
            user?.uid === recipient.id ? buttonOptionsSelf : buttonOptionsOther,
        });
      }}
    />
  );
};

export default MorePostOptionsButton;
