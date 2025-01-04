import { useCallback } from "react";
import { LayoutAnimation } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { AlertCircle, Trash2 } from "@tamagui/lucide-icons";

import { SizableText, Text, View, XStack, YStack } from "~/components/ui";
import { useComments } from "~/hooks/post/useComments";
import Avatar from "../Avatar";
import { BlurContextMenuWrapper } from "../ContextMenu";
import { TimeAgo } from "../Texts";
import useRouteProfile from "~/hooks/useRouteProfile";

interface Comment {
  userId: string;
  id: string;
  body: string;
  username: string;
  profilePictureUrl: string | null;
  createdAt: Date;
}

interface CommentProps {
  postId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
  postRecipientUserId: string;

  listRef: React.RefObject<FlashList<Comment>>;

  comment: Comment;
  isPostOwner: boolean;
  isCommentOwner: boolean;
}

const Comment = ({
  comment,
  isPostOwner,
  isCommentOwner,
  postId,
  endpoint,
  postRecipientUserId,
  listRef,
}: CommentProps) => {
  const { routeProfile } = useRouteProfile();

  const handlePressProfilePicture = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    routeProfile({ userId: comment.userId });
  };

  const handlePressUsername = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    routeProfile({ userId: comment.userId });
  };

  const {
    isLoadingComments,
    commentItems,
    handleLoadMoreComments,
    handlePostComment,
    handleDeleteComment,
    handleReportComment,
  } = useComments({
    postId: postId,
    endpoint: endpoint,
    userId: postRecipientUserId,
  });

  const onDelete = (commentId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listRef.current?.prepareForLayoutAnimationRender();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    handleDeleteComment(commentId);
  };

  const onReport = (commentId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleReportComment(commentId);
  };

  const contextMenuOptions = () => {
    const options = [];

    if (isPostOwner && !isCommentOwner) {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Delete
          </SizableText>
        ),
        icon: <Trash2 size="$1.5" color="$red10" />,
        onPress: () => onDelete(comment.id),
      });
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Report
          </SizableText>
        ),
        icon: <AlertCircle size="$1.5" color="$red10" />,
        onPress: () => onReport(comment.id),
      });
    } else if (isCommentOwner) {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Delete
          </SizableText>
        ),
        icon: <Trash2 size="$1.5" color="$red10" />,
        onPress: () => onDelete(comment.id),
      });
    } else {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Report
          </SizableText>
        ),
        icon: <AlertCircle size="$1.5" color="$red10" />,
        onPress: () => onReport(comment.id),
      });
    }

    return options;
  };

  return (
    <BlurContextMenuWrapper options={contextMenuOptions()}>
      <View padding="$3.5" backgroundColor="$gray4" borderRadius="$7">
        <XStack gap="$3" alignItems="flex-start">
          <TouchableOpacity onPress={handlePressProfilePicture}>
            <Avatar source={comment.profilePictureUrl} size={46} />
          </TouchableOpacity>
          <YStack gap="$2" width="100%" flex={1}>
            <XStack gap="$2">
              <TouchableOpacity onPress={handlePressUsername}>
                <Text fontWeight="bold">{comment.username}</Text>
              </TouchableOpacity>
              <TimeAgo
                size="$2"
                date={comment.createdAt}
                format={({ value, unit }) => `${value}${unit.charAt(0)} ago`}
              />
            </XStack>
            <Text>{comment.body}</Text>
          </YStack>
        </XStack>
      </View>
    </BlurContextMenuWrapper>
  );
};

export default Comment;
