import React, { useCallback, useRef, useState } from "react";
import { Position } from "react-native-image-marker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import watermark from "@assets/watermark.png";
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useToastController } from "@tamagui/toast";

import type { RouterInputs } from "~/utils/api";
import { api } from "~/utils/api";
import BottomSheetWrapper from "../BottomSheets/BottomSheetWrapper";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import CommentsBottomSheet from "./CommentsBottomSheet";
import PostCard from "./PostCard";
import type { PostData as OtherPostProps } from "./PostCard";
import { useSaveMedia } from "./useSaveMedia";

type ReportPostReason = RouterInputs["report"]["reportPost"]["reason"];

type SheetState = "closed" | "moreOptions" | "reportOptions";

const OtherPost = (postProps: OtherPostProps) => {
  const router = useRouter();
  const toast = useToastController();

  const utils = api.useUtils();

  const { saveMedia, isSaving } = useSaveMedia();

  const [sheetState, setSheetState] = useState<SheetState>("closed");

  const { data: hasLiked } = api.post.hasliked.useQuery(
    {
      postId: postProps.id,
    },
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

  const reportPost = api.report.reportPost.useMutation();

  const handleLikePressed = async () => {
    hasLiked
      ? await unlikePost.mutateAsync({ postId: postProps.id })
      : await likePost.mutateAsync({ postId: postProps.id });
  };

  const handleLikeDoubleTapped = async () => {
    if (hasLiked) return;
    await likePost.mutateAsync({ postId: postProps.id });
  };

  const handleComment = () => {
    bottomSheetModalRef.current?.present();
  };

  const handleShare = () => {};

  const handleRecipientPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: postProps.recipient.id,
        username: postProps.recipient.username,
      },
    });
  };

  const handleAuthorPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: postProps.author.id,
        username: postProps.author.username,
      },
    });
  };

  const handleSavePost = async () => {
    await saveMedia(postProps.media.url, {
      image: watermark,
      position: Position.bottomRight,
      scale: 0.7,
    });
    setSheetState("closed");
    toast.show("Post Saved");
  };

  const handleReportPost = async (reason: ReportPostReason) => {
    await reportPost.mutateAsync({ postId: postProps.id, reason });
    toast.show("Post Reported");
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

  const moreOptionsButtonOptions = [
    {
      text: isSaving ? "Saving" : "Save Post",
      textProps: {
        color: isSaving ? "$gray9" : undefined,
      },
      autoClose: false,
      disabled: isSaving,
      onPress: () => void handleSavePost(),
    },
    {
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
      disabled: isSaving,
      onPress: handleOpenReportOptionsSheet,
    },
  ] satisfies ButtonOption[];

  const reportPostOptionsButtonOptions = [
    {
      text: "Violent or abusive",
      textProps: { color: "$blue9" },
      onPress: () => void handleReportPost("Violent or abusive"),
    },
    {
      text: "Sexually explicit or predatory",
      textProps: { color: "$blue9" },
      onPress: () => void handleReportPost("Sexually explicit or predatory"),
    },
    {
      text: "Hate, harassment, or bullying",
      textProps: { color: "$blue9" },
      onPress: () => void handleReportPost("Hate, harassment or bullying"),
    },
    {
      text: "Suicide and self-harm",
      textProps: { color: "$blue9" },
      onPress: () => void handleReportPost("Suicide and self-harm"),
    },
    {
      text: "Scam or spam",
      textProps: { color: "$blue9" },
      onPress: () => void handleReportPost("Spam or scam"),
    },
    {
      text: "Other",
      textProps: { color: "$blue9" },
      onPress: () => void handleReportPost("Other"),
    },
  ] satisfies ButtonOption[];

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const { data: comments, isLoading: isLoadingComments } =
    api.post.paginateComments.useQuery({
      postId: postProps.id,
    });

  const commentItems =
    comments?.items.map((comment) => ({
      id: comment.commentId,
      body: comment.body,
      username: comment.username ?? "",
      profilePictureUrl: comment.profilePictureUrl,
      createdAt: comment.createdAt,
    })) ?? [];

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
                userId: "temp",
                username: "temp",
                commentId: 5,
                profilePictureUrl: "temp",
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

  const handlePostComment = async (comment: string) => {
    await postComment.mutateAsync({
      postId: postProps.id,
      body: comment,
    });
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

      <ActionSheet
        isVisible={sheetState === "reportOptions"}
        buttonOptions={reportPostOptionsButtonOptions}
        onCancel={handleCloseReportOptionsSheet}
      />
      <ActionSheet
        isVisible={sheetState === "moreOptions"}
        buttonOptions={moreOptionsButtonOptions}
        onCancel={handleCloseMoreOptionsSheet}
      />

      <CommentsBottomSheet
        ref={bottomSheetModalRef}
        comments={commentItems}
        isLoading={isLoadingComments}
        // onEndReached={handleLoadMoreComments}
        onPostComment={handlePostComment}
        // onDeleteComment={handleDeleteComment}
        // onReportComment={handleReportComment}
        currentUserProfilePicture="https://picsum.photos/200/300"
      />
    </>
  );
};

export default OtherPost;
