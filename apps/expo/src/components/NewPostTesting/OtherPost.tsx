import React, { useRef, useState } from "react";
import { Position } from "react-native-image-marker";
import { useRouter } from "expo-router";
import watermark from "@assets/watermark.png";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useToastController } from "@tamagui/toast";

import type { RouterInputs } from "~/utils/api";
import { api } from "~/utils/api";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import CommentsBottomSheet from "./CommentsBottomSheet";
import PostCard from "./PostCard";
import type { PostData as OtherPostProps } from "./PostCard";
import { useSaveMedia } from "./useSaveMedia";

type ReportPostReason = RouterInputs["report"]["reportPost"]["reason"];
type _ReportCommentReason = RouterInputs["report"]["reportComment"]["reason"];

type SheetState = "closed" | "moreOptions" | "reportOptions";

export const useLikePost = (postId: number) => {
  const utils = api.useUtils();
  const { data: hasLiked } = api.post.hasliked.useQuery(
    { postId },
    { initialData: false },
  );

  const likePost = api.post.likePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.hasliked.cancel();

      // Get the data from the query cache
      const prevData = utils.post.hasliked.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.hasliked.setData(
        { postId: newHasLikedData.postId },
        !prevData,
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.hasliked.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.hasliked.invalidate();
    },
  });

  const unlikePost = api.post.unlikePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.hasliked.cancel();

      // Get the data from the query cache
      const prevData = utils.post.hasliked.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.hasliked.setData({ postId: newHasLikedData.postId }, false);

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.hasliked.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.hasliked.invalidate();
    },
  });

  const handleLikePressed = async () => {
    hasLiked
      ? await unlikePost.mutateAsync({ postId })
      : await likePost.mutateAsync({ postId });
  };

  const handleLikeDoubleTapped = async () => {
    if (hasLiked) return;
    await likePost.mutateAsync({ postId });
  };

  return { hasLiked, handleLikePressed, handleLikeDoubleTapped };
};

export const useReportPost = (postId: number) => {
  const toast = useToastController();
  const reportPost = api.report.reportPost.useMutation();

  const handleReportPost = async (reason: ReportPostReason) => {
    await reportPost.mutateAsync({ postId, reason });
    toast.show("Post Reported");
  };

  return { handleReportPost };
};

export const useComments = (postId: number) => {
  const router = useRouter();
  const toast = useToastController();
  const utils = api.useUtils();

  const {
    data: comments,
    isLoading: isLoadingComments,
    hasNextPage: commentsHasNextPage,
    isFetchingNextPage: commentsIsFetchingNextPage,
    fetchNextPage: fetchNextCommentsPage,
  } = api.post.paginateComments.useInfiniteQuery(
    { postId, pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor, },
  );

  const postComment = api.post.createComment.useMutation({
    onMutate: async (newCommentData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.paginateComments.cancel({
        postId: newCommentData.postId,
        pageSize: 10,
      });

      // Get the data from the query cache
      const prevData = utils.post.paginateComments.getInfiniteData({
        postId: newCommentData.postId,
        pageSize: 10,
      });
      if (prevData === undefined) return;

      const currentUser = utils.profile.getFullProfileSelf.getData();

      // Optimistically update the data
      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId, pageSize: 10 },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: [
              {
                ...newCommentData,
                commentId: new Date().getTime(),
                userId: currentUser?.userId ?? "",
                username: currentUser?.username ?? "",
                profilePictureUrl: currentUser?.profilePictureUrl ?? "",
                createdAt: new Date(),
              },
              ...page.items,
            ],
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, newCommentData, ctx) => {
      if (ctx === undefined) return;

      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      await utils.post.paginateComments.invalidate();
    },
  });

  const deleteComment = api.post.deleteComment.useMutation({
    onMutate: async (newCommentData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.paginateComments.cancel({ postId, pageSize: 10 });

      // Get the data from the query cache
      const prevData = utils.post.paginateComments.getInfiniteData({
        postId,
        pageSize: 10,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.paginateComments.setInfiniteData(
        { postId, pageSize: 10 },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (comment) => comment.commentId !== newCommentData.commentId,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, newCommentData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, revert to the previous data
      utils.post.paginateComments.setInfiniteData(
        { postId, pageSize: 10 },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.paginateComments.invalidate();
    },
  });

  const reportComment = api.report.reportComment.useMutation();

  const handleLoadMoreComments = async () => {
    if (commentsHasNextPage && !commentsIsFetchingNextPage) {
      await fetchNextCommentsPage();
    }
  };

  const handlePostComment = async (comment: string) => {
    await postComment.mutateAsync({ postId, body: comment });
  };

  const handleDeleteComment = async (commentId: number) => {
    await deleteComment.mutateAsync({ postId, commentId });
  };

  const handleReportComment = async (commentId: number) => {
    await reportComment.mutateAsync({ commentId, reason: "Other" });
    toast.show("Comment Reported");
  };

  const handlePressProfilePicture = (userId: string, username: string) => {
    router.push({
      pathname: `/profile/[userId]`,
      params: { userId, username },
    });
  };

  const handlePressUsername = (userId: string, username: string) => {
    router.push({
      pathname: `/profile/[userId]`,
      params: { userId, username },
    });
  };

  const commentItems =
    comments?.pages
      .flatMap((page) => page.items)
      .map((comment) => ({
        userId: comment.userId,
        id: comment.commentId,
        body: comment.body,
        username: comment.username ?? "",
        profilePictureUrl: comment.profilePictureUrl,
        createdAt: comment.createdAt,
      })) ?? [];

  return {
    commentItems,
    isLoadingComments,
    handleLoadMoreComments,
    handlePostComment,
    handleDeleteComment,
    handleReportComment,
    handlePressProfilePicture,
    handlePressUsername,
  };
};

export const usePostActions = (postProps: OtherPostProps) => {
  const router = useRouter();
  const toast = useToastController();
  const { saveMedia, isSaving } = useSaveMedia();

  const handleSavePost = async () => {
    await saveMedia(postProps.media.url, {
      image: watermark,
      position: Position.bottomRight,
      scale: 0.7,
    });
    toast.show("Post Saved");
  };

  const handleShare = () => {
    // TODO: Implement sharing
  };

  const handleRecipientPress = () => {
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: postProps.recipient.id,
        username: postProps.recipient.username,
      },
    });
  };

  const handleAuthorPress = () => {
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: postProps.author.id,
        username: postProps.author.username,
      },
    });
  };

  return {
    handleSavePost,
    handleShare,
    handleRecipientPress,
    handleAuthorPress,
    isSaving,
  };
};

interface MoreOptionsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSavePost: () => void;
  onReportPost: () => void;
  isSaving: boolean;
}

const MoreOptionsSheet = ({
  isVisible,
  onClose,
  onSavePost,
  onReportPost,
  isSaving,
}: MoreOptionsSheetProps) => {
  const moreOptionsButtonOptions = [
    {
      text: isSaving ? "Saving" : "Save Post",
      textProps: {
        color: isSaving ? "$gray9" : undefined,
      },
      autoClose: false,
      disabled: isSaving,
      onPress: onSavePost,
    },
    {
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
      disabled: isSaving,
      onPress: onReportPost,
    },
  ] satisfies ButtonOption[];

  return (
    <ActionSheet
      isVisible={isVisible}
      buttonOptions={moreOptionsButtonOptions}
      onCancel={onClose}
    />
  );
};

interface ReportOptionsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onReportPost: (reason: ReportPostReason) => void;
}

const ReportOptionsSheet = ({
  isVisible,
  onClose,
  onReportPost,
}: ReportOptionsSheetProps) => {
  const reportPostOptionsButtonOptions = [
    {
      text: "Violent or abusive",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Violent or abusive"),
    },
    {
      text: "Sexually explicit or predatory",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Sexually explicit or predatory"),
    },
    {
      text: "Hate, harassment, or bullying",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Hate, harassment or bullying"),
    },
    {
      text: "Suicide and self-harm",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Suicide and self-harm"),
    },
    {
      text: "Scam or spam",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Spam or scam"),
    },
    {
      text: "Other",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Other"),
    },
  ] satisfies ButtonOption[];

  return (
    <ActionSheet
      isVisible={isVisible}
      buttonOptions={reportPostOptionsButtonOptions}
      onCancel={onClose}
    />
  );
};

const OtherPost = (postProps: OtherPostProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [sheetState, setSheetState] = useState<SheetState>("closed");

  const { hasLiked, handleLikePressed, handleLikeDoubleTapped } = useLikePost(
    postProps.id,
  );
  const { handleReportPost } = useReportPost(postProps.id);

  const {
    commentItems,
    isLoadingComments,
    handleLoadMoreComments,
    handlePostComment,
    handleDeleteComment,
    handleReportComment,
    handlePressProfilePicture,
    handlePressUsername,
  } = useComments(postProps.id);

  const {
    handleSavePost,
    handleShare,
    handleRecipientPress,
    handleAuthorPress,
    isSaving,
  } = usePostActions(postProps);

  const handleComment = () => {
    bottomSheetModalRef.current?.present();
  };

  const handleOpenMoreOptionsSheet = () => {
    setSheetState("moreOptions");
  };

  const handleCloseMoreOptionsSheet = () => {
    setSheetState("closed");
  };

  const handleOpenReportOptionsSheet = () => {
    setTimeout(() => setSheetState("reportOptions"), 400);
  };

  const handleCloseReportOptionsSheet = () => {
    setSheetState("closed");
  };

  return (
    <>
      <PostCard
        {...postProps}
        hasLiked={hasLiked}
        onLikePressed={handleLikePressed}
        onLikeDoubleTapped={handleLikeDoubleTapped}
        onComment={handleComment}
        onShare={handleShare}
        onMoreOptions={handleOpenMoreOptionsSheet}
        onAuthorPress={handleAuthorPress}
        onRecipientPress={handleRecipientPress}
      />

      <CommentsBottomSheet
        ref={bottomSheetModalRef}
        comments={commentItems}
        isLoading={isLoadingComments}
        onEndReached={handleLoadMoreComments}
        onPostComment={handlePostComment}
        onDeleteComment={handleDeleteComment}
        onReportComment={handleReportComment}
        onPressProfilePicture={(userId, username) => {
          bottomSheetModalRef.current?.close();
          handlePressProfilePicture(userId, username);
        }}
        onPressUsername={(userId, username) => {
          bottomSheetModalRef.current?.close();
          handlePressUsername(userId, username);
        }}
        selfUserId={postProps.self.id}
        selfProfilePicture={postProps.self.profilePicture}
      />

      <ReportOptionsSheet
        isVisible={sheetState === "reportOptions"}
        onClose={handleCloseReportOptionsSheet}
        onReportPost={handleReportPost}
      />

      <MoreOptionsSheet
        isVisible={sheetState === "moreOptions"}
        onClose={handleCloseMoreOptionsSheet}
        onSavePost={handleSavePost}
        onReportPost={handleOpenReportOptionsSheet}
        isSaving={isSaving}
      />
    </>
  );
};

export default OtherPost;
