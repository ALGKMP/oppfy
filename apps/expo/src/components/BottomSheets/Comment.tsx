import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ImageSourcePropType } from "react-native";
import { LayoutAnimation, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import {
  AlertCircle,
  MessageCircleOff,
  SendHorizontal,
  Trash2,
} from "@tamagui/lucide-icons";
import {
  ScrollView,
  SizableText,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import { useSession } from "~/contexts/SessionContext";
import useProfile from "~/hooks/useProfile";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import { useComments } from "../../hooks/post/useComments";
import Avatar from "../Avatar";
import { BlurContextMenuWrapper } from "../ContextMenu";
import { Skeleton } from "../Skeletons";
import { TimeAgo } from "../Texts";
import { EmptyPlaceholder } from "../UIPlaceholders";

interface Comment {
  userId: string;
  id: string;
  body: string;
  username: string;
  profilePictureUrl: string | null;
  createdAt: Date;
}


interface CommentItemProps {
  comment: Comment;
  isPostOwner: boolean;
  isCommentOwner: boolean;

  onDelete: () => void;
  onReport: () => void;

  onPressProfilePicture: () => void;
  onPressUsername: () => void;
}

const CommentItem = React.memo(

  ({
    comment,
    isPostOwner,
    isCommentOwner,
    onDelete,
    onReport,
    onPressProfilePicture,
    onPressUsername,
  }: CommentItemProps) => {
    const contextMenuOptions = useMemo(() => {
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
    }, [isPostOwner, isCommentOwner, onDelete, onReport]);

    return (
      <BlurContextMenuWrapper options={contextMenuOptions}>
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
  },
);

export default CommentItem;