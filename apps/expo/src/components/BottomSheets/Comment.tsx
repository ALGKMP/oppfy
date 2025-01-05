import { TouchableOpacity } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { AlertCircle, Trash2 } from "@tamagui/lucide-icons";

import { SizableText, Text, View, XStack, YStack } from "~/components/ui";
import useRouteProfile from "~/hooks/useRouteProfile";
import Avatar from "../Avatar";
import { BlurContextMenuWrapper } from "../ContextMenu";
import { TimeAgo } from "../Texts";

export interface CommentItem {
  userId: string;
  id: string;
  body: string;
  username: string;
  profilePictureUrl: string | null;
  createdAt: Date;
}

interface CommentProps {
  comment: CommentItem;
  isPostRecipient: boolean;
  isCommentAuthor: boolean;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string) => void;
  onHideBottomSheet: () => void;
}

const Comment = ({
  comment,
  isPostRecipient,
  isCommentAuthor,
  onDelete,
  onReport,
  onHideBottomSheet,
}: CommentProps) => {
  const { routeProfile } = useRouteProfile();

  const handlePressProfilePicture = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    routeProfile({ userId: comment.userId });
    onHideBottomSheet();
  };

  const handlePressUsername = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    routeProfile({ userId: comment.userId });
    onHideBottomSheet();
  };

  const handleDelete = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete(comment.id);
  };

  const handleReport = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReport(comment.id);
  };

  const contextMenuOptions = () => {
    const options = [];

    if (isPostRecipient && !isCommentAuthor) {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Delete
          </SizableText>
        ),
        icon: <Trash2 size="$1.5" color="$red10" />,
        onPress: handleDelete,
      });
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Report
          </SizableText>
        ),
        icon: <AlertCircle size="$1.5" color="$red10" />,
        onPress: handleReport,
      });
    } else if (isCommentAuthor) {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Delete
          </SizableText>
        ),
        icon: <Trash2 size="$1.5" color="$red10" />,
        onPress: handleDelete,
      });
    } else {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Report
          </SizableText>
        ),
        icon: <AlertCircle size="$1.5" color="$red10" />,
        onPress: handleReport,
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
