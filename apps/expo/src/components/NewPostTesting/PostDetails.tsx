import React from "react";
import { TouchableOpacity } from "react-native";

import { Paragraph, SizableText, Text, XStack, YStack } from "~/components/ui/";
import useRouteProfile from "~/hooks/useRouteProfile";
import CommentButton from "./CommentButton";
import CommentsCount from "./CommentsCount";
import LikeButton from "./LikeButton";
import PostCaption from "./PostCaption";
import PostDate from "./Postdate";
import ShareButton from "./ShareButton";

interface UnderPostProps {
  id: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
  createdAt: Date;
  caption: string;
  author: {
    id: string;
    username: string;
  };
  recipient: {
    id: string;
    username: string;
  };
  stats: {
    likes: number;
    comments: number;
  };
}

const PostDetails = ({
  id,
  endpoint,
  createdAt,
  caption,
  author,
  recipient,
  stats,
}: UnderPostProps) => {
  const { routeProfile } = useRouteProfile();

  const handleAuthorPress = () => {
    routeProfile({ userId: author.id });
  };

  return (
    <>
      {/* Under post */}
      <YStack flex={1} paddingHorizontal="$1" gap="$1">
        <XStack gap="$3.5" alignItems="center">
          {/* Like Button */}
          <LikeButton postId={id} endpoint={endpoint} />

          {/* Comment Button */}
          <CommentButton
            postId={id}
            postRecipientUserId={recipient.id}
            endpoint={endpoint}
          />
          {/* Share Button */}
          <ShareButton postId={id} />
        </XStack>

        {/* Likes Count */}
        {stats.likes > 0 && (
          <TouchableOpacity>
            <SizableText size="$3" fontWeight="bold">
              {stats.likes > 0
                ? `${stats.likes} ${stats.likes === 1 ? "like" : "likes"}`
                : ""}
            </SizableText>
          </TouchableOpacity>
        )}

        {/* Opped by */}
        <TouchableOpacity onPress={handleAuthorPress}>
          <Paragraph>
            <Text fontWeight="bold">
              opped by{" "}
              <Text fontWeight="bold" color="$primary">
                {author.username}
              </Text>
            </Text>
          </Paragraph>
        </TouchableOpacity>

        {/* Caption */}
        <PostCaption caption={caption} />

        {/* Comments Count */}
        <CommentsCount
          commentsCount={stats.comments}
          postId={id}
          endpoint={endpoint}
          postRecipientUserId={recipient.id}
        />

        {/* Post Date */}
        <PostDate createdAt={createdAt} />
      </YStack>
    </>
  );
};

export default PostDetails;
