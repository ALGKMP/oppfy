import React, { useCallback, useMemo, useRef } from "react";
import type { ImageSourcePropType } from "react-native";
import { LayoutAnimation, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { MessageCircleOff } from "@tamagui/lucide-icons";
import { ScrollView, View, XStack, YStack } from "tamagui";

import { useSession } from "~/contexts/SessionContext";
import useProfile from "~/hooks/useProfile";
import { useComments } from "../../hooks/post/useComments";
import { Skeleton } from "../Skeletons";
import { EmptyPlaceholder } from "../UIPlaceholders";
import Comment from "./Comment";
import TextInputWithAvatar from "./TextInputWithAvatar";

type ProfilePicture = ImageSourcePropType | string | undefined | null;

interface CommentsBottomSheetProps {
  postId: string;
  postRecipientUserId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
}

const CommentsBottomSheet = React.memo((props: CommentsBottomSheetProps) => {
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
      <Comment
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
      <TextInputWithAvatar
        onPostComment={handlePostCommentWithAnimation}
        selfProfilePicture={selfProfile?.profilePictureUrl}
      />
    </>
  );
});

const LoadingView = React.memo(() => (
  <ScrollView>
    <XStack padding="$3.5" gap="$2.5">
      <Skeleton circular size={46} />
      <YStack flex={1} gap="$2">
        <Skeleton width="40%" height={20} />
        <Skeleton width="100%" height={20} />
      </YStack>
    </XStack>
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

/*
 * ==========================================
 * ============== Hooks =====================
 * ==========================================
 */

export default CommentsBottomSheet;
