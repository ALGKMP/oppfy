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

import { useSession } from "~/contexts/SessionContext";
import useProfile from "~/hooks/useProfile";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import { useComments } from "../../hooks/post/useComments";
import Avatar from "../Avatar";
import { BlurContextMenuWrapper } from "../ContextMenu";
import { Skeleton } from "../Skeletons";
import { TimeAgo } from "../Texts";
import { EmptyPlaceholder } from "../UIPlaceholders";

/*
 * TODO: Clean up the CommentItem component.
 * TODO: Instead of passing the handlers as props, use the useComments hook within the component itself.
 */

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
  postId: string;
  postRecipientUserId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
}

const CommentsBottomSheet = forwardRef<
  BottomSheetModal,
  CommentsBottomSheetProps
>((props) => {
  const {
    isLoadingComments,
    commentItems,
    handleLoadMoreComments,
    handlePostComment,
    handleDeleteComment,
    handleReportComment,
    handlePressProfilePicture,
    handlePressUsername,
  } = useComments({
    postId: props.postId,
    endpoint: props.endpoint,
    userId: props.postRecipientUserId,
  });

  const listRef = useRef<FlashList<Comment> | null>(null);
  const { profile: selfProfile } = useProfile();
  const { user } = useSession();
  const selfUserId = user?.uid;

  const handleDeleteCommentWithAnimation = useCallback(
    (commentId: string) => {
      listRef.current?.prepareForLayoutAnimationRender();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      handleDeleteComment(commentId);
    },
    [handleDeleteComment],
  );

  const handlePostCommentWithAnimation = useCallback(
    (comment: string) => {
      listRef.current?.prepareForLayoutAnimationRender();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      handlePostComment(comment);
    },
    [handlePostComment],
  );

  const keyExtractor = useCallback((item: Comment) => item.id.toString(), []);

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        key={item.id}
        comment={item}
        isPostOwner={selfUserId === props.postRecipientUserId}
        isCommentOwner={item.userId === selfUserId}
        onDelete={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          handleDeleteCommentWithAnimation(item.id);
        }}
        onReport={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleReportComment(item.id);
        }}
        onPressProfilePicture={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handlePressProfilePicture(item.userId, item.username);
        }}
        onPressUsername={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handlePressUsername(item.userId, item.username);
        }}
      />
    ),
    [
      selfUserId,
      props.postRecipientUserId,
      handleDeleteCommentWithAnimation,
      handleReportComment,
      handlePressProfilePicture,
      handlePressUsername,
    ],
  );

  const ListContent = useMemo(() => {
    if (isLoadingComments) return <LoadingView />;
    if (commentItems.length === 0) return <EmptyCommentsView />;

    return (
      <FlashList
        ref={listRef}
        data={commentItems}
        renderItem={renderComment}
        estimatedItemSize={100}
        onEndReached={handleLoadMoreComments}
        showsVerticalScrollIndicator={false}
        keyExtractor={keyExtractor}
      />
    );
  }, [
    isLoadingComments,
    commentItems,
    renderComment,
    handleLoadMoreComments,
    keyExtractor,
  ]);

  const content = useMemo(
    () => <YStack flex={1}>{ListContent}</YStack>,
    [ListContent],
  );

  return (
    <>
      {content}
      <CommentInput
        onPostComment={handlePostCommentWithAnimation}
        selfProfilePicture={selfProfile?.profilePictureUrl}
      />
    </>
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
        <XStack alignItems="flex-start" gap="$3">
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

/*
 * ==========================================
 * ============== Hooks =====================
 * ==========================================
 */

export default CommentsBottomSheet;
