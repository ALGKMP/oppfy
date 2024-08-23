import type { ForwardRefRenderFunction } from "react";
import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import {
  AlertCircle,
  Minus,
  SendHorizontal,
  Trash2,
} from "@tamagui/lucide-icons";
import {
  getToken,
  ScrollView,
  SizableText,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import Avatar from "../Avatar";
import { BlurContextMenuWrapper } from "../ContextMenu";
import { TimeAgo } from "../Texts";

const EMOJI_LIST = ["❤️", "🙏", "🔥", "😂", "😭", "😢", "😲", "😍"];

interface Comment {
  id: number;
  body: string;
  username: string;
  profilePictureUrl: string | null;
  createdAt: Date;
}

interface CommentsBottomSheetProps {
  comments: Comment[];
  isLoading: boolean;
  onEndReached: () => void;
  onPostComment: (comment: string) => void;
  onDeleteComment: (commentId: number) => void;
  onReportComment: (commentId: number) => void;
  currentUserProfilePicture: string | null;
}

const CommentsBottomSheet: ForwardRefRenderFunction<
  BottomSheetModal,
  CommentsBottomSheetProps
> = (
  {
    comments,
    isLoading,
    onEndReached,
    onPostComment,
    onDeleteComment,
    onReportComment,
    currentUserProfilePicture,
  },
  ref,
) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        comment={item}
        onDelete={() => onDeleteComment(item.id)}
        onReport={() => onReportComment(item.id)}
      />
    ),
    [onDeleteComment, onReportComment],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        {...props}
      />
    ),
    [],
  );

  const renderHeader = useCallback(
    () => (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        position="relative"
      >
        <Minus size="$4" />
        <View justifyContent="center" alignItems="center">
          <SizableText
            size="$5"
            textAlign="center"
            color="$white"
            fontWeight="bold"
          >
            Comments
          </SizableText>
        </View>
        <View
          width="95%"
          borderColor="$gray8"
          borderWidth="$0.25"
          marginTop="$3"
        />
      </YStack>
    ),
    [],
  );

  const content = (
    <YStack flex={1}>
      {isLoading ? (
        <ScrollView>{/* Render skeletons here */}</ScrollView>
      ) : comments.length === 0 ? (
        <EmptyCommentsView />
      ) : (
        <Animated.FlatList
          data={comments}
          renderItem={renderComment}
          onEndReached={onEndReached}
          itemLayoutAnimation={LinearTransition}
        />
      )}

      <CommentInput
        onPostComment={onPostComment}
        currentUserProfilePicture={currentUserProfilePicture}
      />
    </YStack>
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["100%"]}
      topInset={insets.top}
      enablePanDownToClose
      keyboardBlurBehavior="restore"
      handleComponent={renderHeader}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.gray4.val }}
    >
      {content}
    </BottomSheetModal>
  );
};

const EmptyCommentsView = () => (
  <View flex={1} justifyContent="center" alignItems="center">
    <SizableText size="$7" fontWeight="bold">
      No comments yet
    </SizableText>
    <Text color="$gray10">Be the first to comment</Text>
  </View>
);

interface CommentInputProps {
  onPostComment: (comment: string) => void;
  currentUserProfilePicture: string | null;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onPostComment,
  currentUserProfilePicture,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [inputValue, setInputValue] = useState("");

  const handleChangeText = useCallback((text: string) => {
    setInputValue(text);
  }, []);

  const handlePostComment = useCallback(() => {
    if (inputValue.trim().length === 0) return;

    onPostComment(inputValue);
    setInputValue("");
  }, [inputValue, onPostComment]);

  const handleEmojiPress = useCallback((emoji: string) => {
    setInputValue((prev) => prev + emoji);
  }, []);

  return (
    <YStack
      padding="$4"
      paddingBottom={insets.bottom ? insets.bottom : "$4"}
      borderColor="$gray6"
      borderTopWidth={StyleSheet.hairlineWidth}
      gap="$4"
    >
      <XStack justifyContent="space-between">
        {EMOJI_LIST.map((emoji) => (
          <TouchableOpacity key={emoji} onPress={() => handleEmojiPress(emoji)}>
            <SizableText size="$8">{emoji}</SizableText>
          </TouchableOpacity>
        ))}
      </XStack>
      <XStack alignItems="flex-end" gap="$3">
        <Avatar source={currentUserProfilePicture} size={46} />
        <View flex={1} position="relative">
          <BottomSheetTextInput
            placeholder="Add a comment..."
            maxLength={250}
            multiline={true}
            value={inputValue}
            onChangeText={handleChangeText}
            style={[
              styles.input,
              {
                color: theme.color.val,
                backgroundColor: theme.gray5.val,
                borderColor: theme.gray6.val,
              },
            ]}
          />
          <View
            position="absolute"
            bottom={4}
            right={4}
            paddingVertical="$2"
            paddingHorizontal="$3.5"
            borderRadius="$6"
            backgroundColor="#F214FF"
            opacity={inputValue.length === 0 ? 0.5 : 1}
          >
            <TouchableOpacity
              onPress={handlePostComment}
              disabled={inputValue.length === 0}
            >
              <SendHorizontal color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </XStack>
    </YStack>
  );
};

interface CommentItemProps {
  comment: Comment;
  onDelete: () => void;
  onReport: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDelete,
  onReport,
}) => (
  <BlurContextMenuWrapper
    options={[
      {
        label: (
          <Text color="white" marginLeft="$2" fontSize="$5">
            Delete
          </Text>
        ),
        icon: <Trash2 size="$1.5" color="white" />,
        onPress: onDelete,
      },
      {
        label: (
          <Text color="red" marginLeft="$2" fontSize="$5">
            Report
          </Text>
        ),
        icon: <AlertCircle size="$1.5" color="red" />,
        onPress: onReport,
      },
    ]}
  >
    <View padding="$3.5" backgroundColor="$gray4" borderRadius="$7">
      <XStack gap="$3" alignItems="center">
        <Avatar source={comment.profilePictureUrl} size={46} />
        <YStack gap="$2" width="100%" flex={1}>
          <XStack gap="$2">
            <Text fontWeight="bold">{comment.username}</Text>
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

const styles = StyleSheet.create({
  input: {
    minHeight: 46,
    textAlignVertical: "center",
    padding: getToken("$3", "space") as number,
    paddingRight: 64,
    borderRadius: getToken("$6", "radius") as number,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default forwardRef(CommentsBottomSheet);
