import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import PostCard from "./PostCard";
import type { PostData as PostCardProps } from "./PostCard";

const OtherPost = (props: PostCardProps) => {
  const router = useRouter();

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

  const handleReportPost = () => {
    console.log("Reporting post");
    setIsActionSheetVisible(false);
  };

  const buttonOptions: ButtonOption[] = [
    {
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
      onPress: handleReportPost,
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

  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

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
        title="More Options"
        subtitle="Choose an action for this post"
        buttonOptions={buttonOptions}
        onCancel={handleCloseActionSheet}
      />
    </>
  );
};

export default OtherPost;
