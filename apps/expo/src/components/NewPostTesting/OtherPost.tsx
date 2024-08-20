import React, { useState } from "react";
import { Position } from "react-native-image-marker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import watermark from "@assets/watermark.png";
import { useToastController } from "@tamagui/toast";
import { useTheme } from "tamagui";

import { api, RouterInputs } from "~/utils/api";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import PostCard from "./PostCard";
import type { PostData as OtherPostProps } from "./PostCard";
import { useSaveMedia } from "./useSaveMedia";

type ReportPostReason = RouterInputs["report"]["reportPost"]["reason"];

const OtherPost = (postProps: OtherPostProps) => {
  const router = useRouter();
  const toast = useToastController();

  const { saveMedia, isSaving } = useSaveMedia();

  const reportPost = api.report.reportPost.useMutation();

  const [activeSheet, setActiveSheet] = useState<'none' | 'moreOptions' | 'reportOptions'>('none');

  const handleLike = () => {
    // Implement self post like logic
    console.log("Self post liked");
  };

  const handleComment = () => {
    // Implement self post comment logic
    console.log("Commenting on self post");
  };

  const handleShare = () => {
    // Implement self post share logic
    console.log("Sharing self post");
  };

  const handleOpenMoreOptionsSheet = () => {
    setActiveSheet('moreOptions');
  };

  const handleCloseMoreOptionsSheet = () => {
    setActiveSheet('none');
  };

  const handleOpenReportOptionsSheet = () => {
    setActiveSheet('reportOptions');
  };

  const handleCloseReportOptionsSheet = () => {
    setActiveSheet('none');
  };

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
    setActiveSheet('none');
    toast.show("Post Saved");
  };

  const handleReportPost = async (reason: ReportPostReason) => {
    await reportPost.mutateAsync({ postId: postProps.id, reason });
    setActiveSheet('none');
    toast.show("Post Reported");
  };

  const moreOptionsButtonOptions = [
    {
      text: isSaving ? "Saving" : "Save Post",
      textProps: {
        color: isSaving ? "$gray9" : undefined,
      },
      onPress: () => void handleSavePost(),
    },
    {
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
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
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onMoreOptions={handleOpenMoreOptionsSheet}
        onAuthorPress={handleAuthorPress}
        onRecipientPress={handleRecipientPress}
      />

      <ActionSheet
        isVisible={activeSheet === 'moreOptions'}
        buttonOptions={moreOptionsButtonOptions}
        onCancel={handleCloseMoreOptionsSheet}
      />

      <ActionSheet
        isVisible={activeSheet === 'reportOptions'}
        buttonOptions={reportPostOptionsButtonOptions}
        onCancel={handleCloseReportOptionsSheet}
      />
    </>
  );
};

export default OtherPost;