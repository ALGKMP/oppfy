import React, { useCallback } from "react";
import { Share } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Circle, getTokens, Text, XStack, YStack } from "tamagui";

import CommentsBottomSheet from "~/components/Post/Comment/CommentsBottomSheet";
import { useBottomSheetController } from "~/components/ui/BottomSheet";
import { usePostInteractions } from "~/hooks/post/usePostInteractions";
import useShare from "~/hooks/useShare";
import { Icon } from "../ui";

interface PostStatsProps {
  postId: string;
  recipientUserId: string;
  endpoint: "self-profile" | "other-profile" | "home-feed" | "single-post";
  stats: {
    likes: number;
    comments: number;
    hasLiked: boolean;
  };
}

const useButtonAnimation = () => {
  const scale = useSharedValue(1);

  const buttonScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animate = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(
      1.2,
      {
        damping: 10,
        stiffness: 200,
      },
      () => {
        scale.value = withSpring(1, {
          damping: 10,
          stiffness: 200,
        });
      },
    );
  }, [scale]);

  return { buttonScale, animate };
};

const StatButton = ({
  count,
  children,
}: {
  count?: number;
  children: React.ReactNode;
}) => {
  const formatCount = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <BlurView
      intensity={30}
      style={{
        padding: 12,
        borderRadius: 20,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: `${getTokens().color.$primary.val}90`,
      }}
    >
      <XStack justifyContent="center" alignItems="center" gap="$2">
        {count !== undefined && count > 0 && (
          <Text color="white" fontWeight="500">
            {formatCount(count)}
          </Text>
        )}
        {children}
      </XStack>
    </BlurView>
  );
};

const LikeAction = ({
  postId,
  initialPostStats,
}: {
  postId: string;
  initialPostStats: PostStatsProps["stats"];
}) => {
  const { buttonScale, animate } = useButtonAnimation();
  const { handleLikePressed, postStats } = usePostInteractions({
    postId,
    initialPostStats,
  });

  const handlePress = () => {
    void handleLikePressed();
    animate();
  };

  return (
    <StatButton count={postStats.likes}>
      <Animated.View style={buttonScale}>
        <Icon
          name="heart"
          onPress={handlePress}
          color={postStats.hasLiked ? "#ff3b30" : "white"}
        />
      </Animated.View>
    </StatButton>
  );
};

const CommentAction = ({
  postId,
  endpoint,
  recipientUserId,
  count,
}: {
  postId: string;
  endpoint: PostStatsProps["endpoint"];
  recipientUserId: string;
  count: number;
}) => {
  const { buttonScale, animate } = useButtonAnimation();
  const { show, hide } = useBottomSheetController();

  const handlePress = () => {
    animate();
    show({
      snapPoints: ["100%"],
      title: "Comments",
      children: (
        <CommentsBottomSheet
          postId={postId}
          endpoint={endpoint}
          postRecipientUserId={recipientUserId}
          onHideBottomSheet={hide}
        />
      ),
    });
  };

  return (
    <StatButton count={count}>
      <Animated.View style={buttonScale}>
        <Icon name="chatbubble-outline" onPress={handlePress} color="white" />
      </Animated.View>
    </StatButton>
  );
};

const ShareAction = ({ postId }: { postId: string }) => {
  const { buttonScale, animate } = useButtonAnimation();
  const { sharePost } = useShare();

  const handlePress = async () => {
    animate();
    await sharePost(postId);
  };

  return (
    <StatButton>
      <Animated.View style={buttonScale}>
        <Icon name="share-outline" onPress={handlePress} color="white" />
      </Animated.View>
    </StatButton>
  );
};

export const PostStats = ({
  postId,
  recipientUserId,
  endpoint,
  stats,
}: PostStatsProps) => {
  return (
    <YStack
      position="absolute"
      right={0}
      bottom={24}
      paddingRight="$4"
      gap="$5"
      zIndex={3}
      alignItems="flex-end"
    >
      <LikeAction postId={postId} initialPostStats={stats} />
      <CommentAction
        postId={postId}
        endpoint={endpoint}
        recipientUserId={recipientUserId}
        count={stats.comments}
      />
      <ShareAction postId={postId} />
    </YStack>
  );
};
