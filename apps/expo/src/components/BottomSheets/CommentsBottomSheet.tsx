import React, { useRef } from "react";
import { LayoutAnimation } from "react-native";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { MessageCircleOff } from "@tamagui/lucide-icons";

import { View } from "~/components/ui";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { useSession } from "~/contexts/SessionContext";
import { useComments } from "~/hooks/post/useComments";
import useRouteProfile from "~/hooks/useRouteProfile";
import Comment from "./Comment";
import type { CommentItem } from "./Comment";
import TextInputWithAvatar from "./TextInputWithAvatar";

interface CommentsBottomSheetProps {
  postId: string;
  postRecipientUserId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
  onHideBottomSheet: () => void;
}

const CommentsBottomSheet = React.memo((props: CommentsBottomSheetProps) => {
  const {
    commentItems,
    loadMoreComments,
    postComment,
    reportComment,
    deleteComment,
  } = useComments({
    postId: props.postId,
    endpoint: props.endpoint,
    userId: props.postRecipientUserId,
  });

  const listRef = useRef<FlashList<CommentItem> | null>(null);
  const { user } = useSession();
  const selfUserId = user?.uid;
  const { routeProfile } = useRouteProfile();

  const handlePostCommentWithAnimation = (comment: string) => {
    listRef.current?.prepareForLayoutAnimationRender();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    postComment(comment);
  };

  const handleDeleteWithAnimation = (commentId: string) => {
    listRef.current?.prepareForLayoutAnimationRender();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    deleteComment(commentId);
  };

  const renderComment = ({ item }: { item: CommentItem }) => (
    <Comment
      key={item.id}
      comment={item}
      isPostRecipient={selfUserId === props.postRecipientUserId}
      isCommentAuthor={item.userId === selfUserId}
      onDelete={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleDeleteWithAnimation(item.id);
      }}
      onReport={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        reportComment(item.id);
      }}
      onPressProfile={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        routeProfile({ userId: item.userId });
        props.onHideBottomSheet();
      }}
    />
  );

  return (
    <>
      {commentItems.length === 0 ? (
        <ListEmptyComponent />
      ) : (
        <FlashList
          ref={listRef}
          data={commentItems}
          renderItem={renderComment}
          estimatedItemSize={83}
          onEndReached={loadMoreComments}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          removeClippedSubviews={true}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />
      )}
      <TextInputWithAvatar onPostComment={handlePostCommentWithAnimation} />
    </>
  );
});

const ListEmptyComponent = () => (
  <View flex={1} justifyContent="center" alignItems="center" flexGrow={1}>
    <EmptyPlaceholder
      title="No comments yet"
      subtitle="Be the first to comment"
      icon={<MessageCircleOff />}
    />
  </View>
);
/*
 * ==========================================
 * ============== Hooks =====================
 * ==========================================
 */

export default CommentsBottomSheet;
