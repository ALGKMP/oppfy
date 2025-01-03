import { TouchableOpacity } from "react-native-gesture-handler";
import { AlertCircle, Trash2 } from "@tamagui/lucide-icons";

import { SizableText, Text, View, XStack, YStack } from "~/components/ui";
import Avatar from "../Avatar";
import { BlurContextMenuWrapper } from "../ContextMenu";
import { TimeAgo } from "../Texts";

interface Comment {
  userId: string;
  id: string;
  body: string;
  username: string;
  profilePictureUrl: string | null;
  createdAt: Date;
}

interface CommentProps {
  comment: Comment;
  isPostOwner: boolean;
  isCommentOwner: boolean;

  onDelete: () => void;
  onReport: () => void;

  onPressProfilePicture: () => void;
  onPressUsername: () => void;
}

const Comment = ({
  comment,
  isPostOwner,
  isCommentOwner,
  onDelete,
  onReport,
  onPressProfilePicture,
  onPressUsername,
}: CommentProps) => {
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
        onPress: onDelete,
      });
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Report
          </SizableText>
        ),
        icon: <AlertCircle size="$1.5" color="$red10" />,
        onPress: onReport,
      });
    } else if (isCommentOwner) {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Delete
          </SizableText>
        ),
        icon: <Trash2 size="$1.5" color="$red10" />,
        onPress: onDelete,
      });
    } else {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Report
          </SizableText>
        ),
        icon: <AlertCircle size="$1.5" color="$red10" />,
        onPress: onReport,
      });
    }

    return options;
  };

  return (
    <BlurContextMenuWrapper options={contextMenuOptions()}>
      <View padding="$3.5" backgroundColor="$gray4" borderRadius="$7">
        <XStack gap="$3" alignItems="flex-start">
          <TouchableOpacity onPress={onPressProfilePicture}>
            <Avatar source={comment.profilePictureUrl} size={46} />
          </TouchableOpacity>
          <YStack gap="$2" width="100%" flex={1}>
            <XStack gap="$2">
              <TouchableOpacity onPress={onPressUsername}>
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
