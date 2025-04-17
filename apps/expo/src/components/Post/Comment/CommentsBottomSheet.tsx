import React, { useRef } from "react";
import { LayoutAnimation } from "react-native";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { MessageCircleOff } from "@tamagui/lucide-icons";

import { useReport } from "~/components/Post/hooks/useReport";
import { EmptyPlaceholder, View } from "~/components/ui";
import { usePostInteractions } from "~/hooks/post/usePostInteractions";
import { useAuth } from "~/hooks/useAuth";
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
  const { comments, loadMoreComments, postComment, deleteComment } =
    usePostInteractions({
      postId: props.postId,
      initialPostStats: {
        likes: 0,
        comments: 0,
        hasLiked: false,
      },
    });
  const { handleReportComment } = useReport({ postId: props.postId });

  const listRef = useRef<FlashList<CommentItem> | null>(null);
  const { user } = useAuth();
  const selfUserId = user?.uid;
  const { routeProfile } = useRouteProfile();

  const handlePostCommentWithAnimation = async (comment: string) => {
    listRef.current?.prepareForLayoutAnimationRender();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await postComment(comment);
  };

  const handleDeleteWithAnimation = async (commentId: string) => {
    listRef.current?.prepareForLayoutAnimationRender();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await deleteComment(commentId);
  };

  const renderComment = ({ item }: { item: CommentItem }) => (
    <Comment
      key={item.id}
      comment={item}
      isPostRecipient={selfUserId === props.postRecipientUserId}
      isCommentAuthor={item.userId === selfUserId}
      onDelete={async () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await handleDeleteWithAnimation(item.id);
      }}
      onReport={async () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await handleReportComment(item.id);
      }}
      onProfilePress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        routeProfile(item.userId);
        props.onHideBottomSheet();
      }}
    />
  );

  return (
    <>
      {comments?.pages.length === 0 ? (
        <ListEmptyComponent />
      ) : (
        <FlashList
          ref={listRef}
          data={
            comments?.pages.flatMap((page) =>
              page.items.map((item) => ({
                id: item.comment.id,
                userId: item.authorUserId,
                body: item.comment.body,
                username: item.authorUsername,
                profilePictureUrl: item.authorProfilePictureUrl,
                createdAt: item.comment.createdAt,
              })),
            ) ?? []
          }
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
