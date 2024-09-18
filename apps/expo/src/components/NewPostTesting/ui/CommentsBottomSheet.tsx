import React, {
  forwardRef,
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
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
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

import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import Avatar from "../../Avatar";
import { BlurContextMenuWrapper } from "../../ContextMenu";
import { Skeleton } from "../../Skeletons";
import { TimeAgo } from "../../Texts";
import { EmptyPlaceholder } from "../../UIPlaceholders";
import BottomSheetBackdrop from "./BottomSheetBackdrop";
import BottomSheetHeader from "./BottomSheetHeader";

const EMOJI_LIST = ["❤️", "🙏", "🔥", "😂", "😭", "😢", "😲", "😍"];

type ProfilePicture = ImageSourcePropType | string | undefined | null;

interface Comment {
  userId: string;
  id: string;
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
  onDeleteComment: (commentId: string) => void;
  onReportComment: (commentId: string) => void;
  selfUserId: string;
  selfProfilePicture: ProfilePicture;
  onPressProfilePicture: (userId: string, username: string) => void;
  onPressUsername: (userId: string, username: string) => void;
}

const CommentsBottomSheet = forwardRef<
  BottomSheetModal,
  CommentsBottomSheetProps
>((props, ref) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlashList<Comment> | null>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      listRef.current?.prepareForLayoutAnimationRender();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      props.onDeleteComment(commentId);
    },
    [props],
  );

  const handlePostComment = useCallback(
    (comment: string) => {
      listRef.current?.prepareForLayoutAnimationRender();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      props.onPostComment(comment);
    },
    [props],
  );

  const keyExtractor = useCallback((item: Comment) => item.id.toString(), []);

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        key={item.id}
        comment={item}
        selfUserId={props.selfUserId}
        onDelete={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleDeleteComment(item.id);
        }}
        onReport={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          props.onReportComment(item.id);
        }}
        onPressProfilePicture={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          props.onPressProfilePicture(item.userId, item.username);
        }}
        onPressUsername={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          props.onPressUsername(item.userId, item.username);
        }}
      />
    ),
    [handleDeleteComment, props],
  );

  const ListContent = useMemo(() => {
    if (props.isLoading) return <LoadingView />;
    if (props.comments.length === 0) return <EmptyCommentsView />;

    return (
      <FlashList
        ref={listRef}
        data={props.comments}
        renderItem={renderComment}
        estimatedItemSize={100}
        onEndReached={props.onEndReached}
        showsVerticalScrollIndicator={false}
        keyExtractor={keyExtractor}
      />
    );
  }, [
    props.isLoading,
    props.comments,
    renderComment,
    props.onEndReached,
    keyExtractor,
  ]);

  const content = useMemo(
    () => <YStack flex={1}>{ListContent}</YStack>,
    [ListContent],
  );

  const handleComponent = useCallback(
    () => <BottomSheetHeader title="Comments" />,
    [],
  );

  const backdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} />,
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      topInset={insets.top}
      enablePanDownToClose
      handleComponent={handleComponent}
      backdropComponent={backdropComponent}
      backgroundStyle={{ backgroundColor: theme.gray4.val }}
    >
      {content}
      <CommentInput
        onPostComment={handlePostComment}
        selfProfilePicture={props.selfProfilePicture}
      />
    </BottomSheetModal>
  );
});

const LoadingView = React.memo(() => (
  <ScrollView>
    {PLACEHOLDER_DATA.map((_, index) => (
      <XStack key={index} padding="$3.5" gap="$2.5">
        <Skeleton circular size={46} />
        <YStack flex={1} gap="$2">
          <Skeleton width="40%" height={20} />
          <Skeleton width="100%" height={20} />
        </YStack>
      </XStack>
    ))}
  </ScrollView>
));

const EmptyCommentsView = React.memo(() => (
  <View flex={1} justifyContent="center" alignItems="center">
    <EmptyPlaceholder
      title="No comments yet"
      subtitle="Be the first to comment"
      icon={<MessageCircleOff />}
    />
  </View>
));

interface CommentInputProps {
  onPostComment: (comment: string) => void;
  selfProfilePicture: ProfilePicture;
}

const CommentInput = React.memo(
  ({ onPostComment, selfProfilePicture }: CommentInputProps) => {
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
            <TouchableOpacity
              key={emoji}
              onPress={() => handleEmojiPress(emoji)}
            >
              <SizableText size="$8">{emoji}</SizableText>
            </TouchableOpacity>
          ))}
        </XStack>
        <XStack alignItems="flex-end" gap="$3">
          <Avatar source={selfProfilePicture} size={46} bordered />
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
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handlePostComment();
                }}
                disabled={inputValue.length === 0}
              >
                <SendHorizontal color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </XStack>
      </YStack>
    );
  },
);

interface CommentItemProps {
  comment: Comment;
  selfUserId: string;
  onDelete: () => void;
  onReport: () => void;
  onPressProfilePicture: () => void;
  onPressUsername: () => void;
}

const CommentItem = React.memo(
  ({
    comment,
    selfUserId,
    onDelete,
    onReport,
    onPressProfilePicture,
    onPressUsername,
  }: CommentItemProps) => {
    const isSelfComment = comment.userId === selfUserId;
    console.log("COMMENT: ", comment.userId);
    console.log("SELF ID: ", selfUserId);

    const contextMenuOptions = isSelfComment
      ? [
          {
            label: (
              <SizableText size="$5" color="$red10">
                Delete
              </SizableText>
            ),
            icon: <Trash2 size="$1.5" color="$red10" />,
            onPress: onDelete,
          },
        ]
      : [
          {
            label: (
              <SizableText size="$5" color="$red10">
                Report
              </SizableText>
            ),
            icon: <AlertCircle size="$1.5" color="$red10" />,
            onPress: onReport,
          },
        ];

    return (
      <BlurContextMenuWrapper options={contextMenuOptions}>
        <View padding="$3.5" backgroundColor="$gray4" borderRadius="$7">
          <XStack gap="$3" alignItems="center">
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

const styles = StyleSheet.create({
  input: {
    padding: 14,
    minHeight: 46,
    paddingRight: 64,
    borderRadius: 16,
    textAlignVertical: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default CommentsBottomSheet;
