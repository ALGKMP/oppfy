import { useReport } from "~/components/Post/hooks/useReport";
import {
  Icon,
  useActionSheetController,
  useAlertDialogController,
} from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";
import { useDeletePost } from "./hooks/useDeletePost";

interface MorePostOptionsButtonProps {
  postId: string;
  recipientUserId: string;
  assetUrl: string;
}

const MorePostOptionsButton = (props: MorePostOptionsButtonProps) => {
  const { reportPost } = useReport();
  const { deletePost, isDeleting } = useDeletePost();

  const { user } = useAuth();
  const { show: showAlert } = useAlertDialogController();
  const { show, hide } = useActionSheetController();

  const buttonOptionsOther = [
    {
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
      onPress: () => {
        void show({
          title: "Report Post",
          titleProps: {
            color: "$red9",
          },
          buttonOptions: [
            {
              text: "Violent or abusive",
              textProps: { color: "$blue9" },
              onPress: () =>
                void reportPost({
                  postId: props.postId,
                  reason: "Violent or abusive",
                }),
              autoClose: true,
            },
            {
              text: "Sexually explicit or predatory",
              textProps: { color: "$blue9" },
              onPress: () =>
                void reportPost({
                  postId: props.postId,
                  reason: "Sexually explicit or predatory",
                }),
              autoClose: true,
            },
            {
              text: "Hate, harassment, or bullying",
              textProps: { color: "$blue9" },
              onPress: () =>
                void reportPost({
                  postId: props.postId,
                  reason: "Hate, harassment or bullying",
                }),
              autoClose: true,
            },
            {
              text: "Suicide and self-harm",
              textProps: { color: "$blue9" },
              onPress: () =>
                void reportPost({
                  postId: props.postId,
                  reason: "Suicide and self-harm",
                }),
              autoClose: true,
            },
            {
              text: "Scam or spam",
              textProps: { color: "$blue9" },
              onPress: () =>
                void reportPost({
                  postId: props.postId,
                  reason: "Spam or scam",
                }),
              autoClose: true,
            },
            {
              text: "Other",
              textProps: { color: "$blue9" },
              onPress: () =>
                void reportPost({
                  postId: props.postId,
                  reason: "Other",
                }),
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
          void deletePost(props.postId);
        }
      },
      autoClose: false,
    },
  ];

  return (
    <Icon
      name="ellipsis-horizontal"
      onPress={() => {
        void show({
          title: "More Options",
          buttonOptions:
            user?.uid === props.recipientUserId
              ? buttonOptionsSelf
              : buttonOptionsOther,
        });
      }}
    />
  );
};

export default MorePostOptionsButton;
