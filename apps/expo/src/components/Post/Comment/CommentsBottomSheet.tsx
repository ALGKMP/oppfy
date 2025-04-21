import React, { useRef } from "react";
import { LayoutAnimation } from "react-native";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { MessageCircleOff } from "@tamagui/lucide-icons";

import { useReport } from "~/components/Post/hooks/useReport";
import { EmptyPlaceholder, View } from "~/components/ui";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api, RouterOutputs } from "~/utils/api";
import { useComment } from "../hooks/useComment";
import Comment from "./Comment";
import TextInputWithAvatar from "./TextInputWithAvatar";

type CommentItem = RouterOutputs["post"]["paginateComments"]["items"][number];

interface CommentsBottomSheetProps {
  postId: string;
  postAuthorId: string;
  postRecipientId: string;
  onHide: () => void;
}

const PAGE_SIZE = 10;

const CommentsBottomSheet = (props: CommentsBottomSheetProps) => {
  const { routeProfile } = useRouteProfile();

  const { reportComment } = useReport();
  const { createComment, deleteComment } = useComment({ postId: props.postId });

  const listRef = useRef<FlashList<CommentItem> | null>(null);

  const {
    data: comments,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.post.paginateComments.useInfiniteQuery(
    {
      postId: props.postId,
      pageSize: PAGE_SIZE,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const commentItems = comments?.pages.flatMap((page) => page.items) ?? [];

  const handleCreateCommentWithAnimation = async (comment: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listRef.current?.prepareForLayoutAnimationRender();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await createComment(comment);
  };

  const handleDeleteCommentWithAnimation = async (commentId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listRef.current?.prepareForLayoutAnimationRender();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await deleteComment(commentId);
  };

  const handleReportComment = async (commentId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await reportComment({ commentId, reason: "Other" });
  };

  const handleProfilePress = (userId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    routeProfile(userId);
    props.onHide();
  };

  const loadMoreComments = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  const renderComment = ({ item }: { item: CommentItem }) => (
    <Comment
      {...item}
      postAuthorId={props.postAuthorId}
      postRecipientId={props.postRecipientId}
      onReportComment={() => handleReportComment(item.comment.id)}
      onDeleteComment={() => handleDeleteCommentWithAnimation(item.comment.id)}
      onProfilePress={() => handleProfilePress(item.profile.userId)}
    />
  );

  return (
    <>
      {commentItems.length === 0 ? (
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
          keyExtractor={(item) => item.comment.id}
          data={commentItems}
          renderItem={renderComment}
          estimatedItemSize={80}
          onEndReached={loadMoreComments}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />
      )}
      <TextInputWithAvatar onPostComment={handleCreateCommentWithAnimation} />
    </>
  );
};

export default CommentsBottomSheet;
