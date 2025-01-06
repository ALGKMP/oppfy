import { TouchableOpacity } from "react-native-gesture-handler";
import { AlertCircle, Trash2 } from "@tamagui/lucide-icons";

import { SizableText, Text, View, XStack, YStack } from "~/components/ui";
import Avatar from "../Avatar";
import { TimeAgo } from "../Texts";
import { BlurContextMenuWrapper } from "../ContextMenu";

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
  onDelete: () => void;
  onReport: () => void;
  onPressProfile: () => void;
}

const Comment = ({
  comment,
  isPostRecipient,
  isCommentAuthor,
  onDelete,
  onReport,
  onPressProfile,
}: CommentProps) => {
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
    } else if (isCommentAuthor) {
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
          <TouchableOpacity onPress={onPressProfile}>
            <Avatar
              source={comment.profilePictureUrl}
              size={46}
              recyclingKey={comment.id}
            />
          </TouchableOpacity>
          <YStack gap="$2" width="100%" flex={1}>
            <XStack gap="$2">
              <TouchableOpacity onPress={onPressProfile}>
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
