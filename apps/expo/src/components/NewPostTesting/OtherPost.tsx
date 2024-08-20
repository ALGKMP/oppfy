import React, { useState } from "react";
import { Position } from "react-native-image-marker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import watermark from "@assets/watermark.png";
import { useToastController } from "@tamagui/toast";

import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import PostCard from "./PostCard";
import type { PostData as PostCardProps } from "./PostCard";
import { useSaveMedia } from "./useSaveMedia";

const OtherPost = (props: PostCardProps) => {
  const router = useRouter();
  const toast = useToastController();

  const { saveMedia, isSaving } = useSaveMedia();

  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

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

  const handleMoreOptions = () => {
    setIsActionSheetVisible(true);
  };

  const handleCloseActionSheet = () => {
    setIsActionSheetVisible(false);
  };

  const handleSavePost = async () => {
    toast.show("Post Saved");
    console.log("Saving post");
    await saveMedia(props.media.url, {
      image: watermark,
      position: Position.bottomRight,
    });
  };

  const handleReportPost = () => {
    console.log("Reporting post");
  };

  const buttonOptions: ButtonOption[] = [
    {
      text: "Save Post",
      onPress: () => void handleSavePost(),
    },
    {
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
      onPress: () => void handleReportPost(),
    },
  ];

  const handleRecipientPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: props.recipient.id,
        username: props.recipient.username,
      },
    });
  };

  const handleAuthorPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: `/profile/[userId]`,
      params: { userId: props.author.id, username: props.author.username },
    });
  };

  return (
    <>
      <PostCard
        {...props}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onMoreOptions={handleMoreOptions}
        onAuthorPress={handleAuthorPress}
        onRecipientPress={handleRecipientPress}
      />

      <ActionSheet
        isVisible={isActionSheetVisible}
        buttonOptions={buttonOptions}
        onCancel={handleCloseActionSheet}
      />
    </>
  );
};

export default OtherPost;
