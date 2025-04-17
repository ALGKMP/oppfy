import { TouchableOpacity } from "react-native-gesture-handler";
import { AlertCircle, Trash2 } from "@tamagui/lucide-icons";

import {
  Avatar,
  BlurContextMenuWrapper,
  SizableText,
  Text,
  TimeAgo,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";
import { RouterOutputs } from "~/utils/api";

type CommentItem = RouterOutputs["post"]["paginateComments"]["items"][number];

interface CommentProps extends CommentItem {
  postAuthorId: string;
  postRecipientId: string;
  onDeleteComment: () => void;
  onReportComment: () => void;
  onProfilePress: () => void;
}

const Comment = (props: CommentProps) => {
  const { user } = useAuth();

  const contextMenuOptions = () => {
    const options = [];

    const isCommentAuthor = user?.uid === props.postAuthorId;
    const isPostRecipient = user?.uid === props.postRecipientId;

    if (isPostRecipient) {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Delete
          </SizableText>
        ),
        icon: <Trash2 size="$1.5" color="$red10" />,
        onPress: props.onDeleteComment,
      });
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Report
          </SizableText>
        ),
        icon: <AlertCircle size="$1.5" color="$red10" />,
        onPress: props.onReportComment,
      });
    } else if (isCommentAuthor) {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Delete
          </SizableText>
        ),
        icon: <Trash2 size="$1.5" color="$red10" />,
        onPress: props.onDeleteComment,
      });
    } else {
      options.push({
        label: (
          <SizableText size="$5" color="$red10">
            Report
          </SizableText>
        ),
        icon: <AlertCircle size="$1.5" color="$red10" />,
        onPress: props.onReportComment,
      });
    }
    return options;
  };

  return (
    <BlurContextMenuWrapper options={contextMenuOptions()}>
      <View padding="$3.5" backgroundColor="$gray4" borderRadius="$7">
        <XStack gap="$3" alignItems="flex-start">
          <TouchableOpacity onPress={props.onProfilePress}>
            <Avatar source={props.profile.profilePictureUrl} size={46} />
          </TouchableOpacity>
          <YStack gap="$2" width="100%" flex={1}>
            <XStack gap="$2">
              <TouchableOpacity onPress={props.onProfilePress}>
                <Text fontWeight="bold">{props.profile.username}</Text>
              </TouchableOpacity>
              <TimeAgo
                size="$2"
                date={props.comment.createdAt}
                format={({ value, unit }) => `${value}${unit.charAt(0)} ago`}
              />
            </XStack>
            <Text>{props.comment.body}</Text>
          </YStack>
        </XStack>
      </View>
    </BlurContextMenuWrapper>
  );
};

export default Comment;
