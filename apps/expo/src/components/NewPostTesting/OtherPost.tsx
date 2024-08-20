import React, { useState } from "react";
import { Position } from "react-native-image-marker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import watermark from "@assets/watermark.png";
import { useToastController } from "@tamagui/toast";

import type { RouterInputs } from "~/utils/api";
import { api } from "~/utils/api";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import PostCard from "./PostCard";
import type { PostData as OtherPostProps } from "./PostCard";
import { useSaveMedia } from "./useSaveMedia";

type ReportPostReason = RouterInputs["report"]["reportPost"]["reason"];

type SheetState = "closed" | "moreOptions" | "reportOptions";

const OtherPost = (postProps: OtherPostProps) => {
  const router = useRouter();
  const utils = api.useUtils();
  const toast = useToastController();

  const { saveMedia, isSaving } = useSaveMedia();

  const [sheetState, setSheetState] = useState<SheetState>("closed");

  const reportPost = api.report.reportPost.useMutation();

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

  const handleLikePressed = async () => {
    hasLiked
      ? await unlikePost.mutateAsync({ postId: postProps.id })
      : await likePost.mutateAsync({ postId: postProps.id });
  };

  const handleLikeDoubleTapped = async () => {
    await likePost.mutateAsync({ postId: postProps.id });
  };

  const handleComment = () => {
    console.log("Commenting on self post");
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
    </>
  );
};

export default OtherPost;
