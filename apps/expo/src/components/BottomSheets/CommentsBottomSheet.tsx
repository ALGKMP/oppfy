import React, { useRef } from "react";
import { Dimensions, LayoutAnimation } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { MessageCircleOff } from "@tamagui/lucide-icons";

import { Skeleton } from "~/components/Skeletons";
import { ScrollView, View, XStack, YStack } from "~/components/ui";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { useSession } from "~/contexts/SessionContext";
import { useComments } from "~/hooks/post/useComments";
import Comment from "./Comment";
import type { CommentItem } from "./Comment";
import TextInputWithAvatar from "./TextInputWithAvatar";

interface CommentsBottomSheetProps {
  postId: string;
  postRecipientUserId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
}

const CommentsBottomSheet = React.memo((props: CommentsBottomSheetProps) => {
  const {
    isLoadingComments,
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
      onDelete={handleDeleteWithAnimation}
      onReport={reportComment}
    />
  );

  return (
    <>
      {isLoadingComments ? (
        <ScrollView>
          <XStack padding="$3.5" gap="$2.5">
            <Skeleton circular size={46} />
            <YStack flex={1} gap="$2">
              <Skeleton width="40%" height={20} />
              <Skeleton width="100%" height={20} />
            </YStack>
          </XStack>
        </ScrollView>
      ) : commentItems.length === 0 ? (
        <View flex={1} justifyContent="center" alignItems="center" flexGrow={1}>
          <EmptyPlaceholder
            title="No comments yet"
            subtitle="Be the first to comment"
            icon={<MessageCircleOff />}
          />
        </View>
      ) : (
        <FlashList
          ref={listRef}
          data={commentItems}
          renderItem={renderComment}
          estimatedItemSize={83}
          onEndReached={loadMoreComments}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          estimatedListSize={{
            width: Dimensions.get("window").width,
            height: Dimensions.get("window").height,
          }}
        />
      )}
      <TextInputWithAvatar onPostComment={handlePostCommentWithAnimation} />
    </>
  );
});

/*
 * ==========================================
 * ============== Hooks =====================
 * ==========================================
 */

export default CommentsBottomSheet;
