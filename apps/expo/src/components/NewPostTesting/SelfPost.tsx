import React from "react";
import { useRouter } from "expo-router";

import PostCard from "./PostCard";
import type { PostData as PostCardProps } from "./PostCard";

const SelfPost = (props: PostCardProps) => {
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
    // Implement self post more options logic
    console.log("More options for self post");
  };

  const handleAvatarPress = () => {
    // Navigate to own profile or perform other action
    console.log("Avatar pressed on self post");
  };

  const handleUsernamePress = () => {
    // Navigate to own profile or perform other action
    console.log("Username pressed on self post");
    router.push({
      pathname: `/profile/[userId]`,
      params: { userId: props.author.id, username: props.author.username },
    });
  };

  return (
    <PostCard
      {...props}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onMoreOptions={handleMoreOptions}
      onAuthorPress={handleAuthorPress}
      onRecipientPress={handleRecipientPress}
    />
  );
};

export default SelfPost;
