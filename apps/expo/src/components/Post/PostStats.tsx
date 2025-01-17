import React, { useCallback } from "react";
import { Share } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Text, XStack, YStack } from "tamagui";

import CommentsBottomSheet from "~/components/Post/Comment/CommentsBottomSheet";
import { useBottomSheetController } from "~/components/ui/BottomSheet";
import { useLikePost } from "~/hooks/post/useLikePost";
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
      intensity={50}
      style={{
        padding: 4,
        borderRadius: 24,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
      }}
    >
      <XStack justifyContent="center" alignItems="center">
        {count !== undefined && count > 0 && (
          <Text color="white" paddingLeft="$2">
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
  endpoint,
  initialHasLiked,
  count,
}: {
  postId: string;
  endpoint: PostStatsProps["endpoint"];
  initialHasLiked: boolean;
  count: number;
}) => {
  const { buttonScale, animate } = useButtonAnimation();
  const { handleLikePressed, hasLiked } = useLikePost({
    postId,
    endpoint,
    initialHasLiked,
  });

  const handlePress = () => {
    void handleLikePressed();
    animate();
  };

  return (
    <StatButton count={count}>
      <Animated.View style={buttonScale}>
        <Icon
          name="heart"
          onPress={handlePress}
          color={hasLiked ? "#ff3b30" : "white"}
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

  const handlePress = async () => {
    animate();
    try {
      await Share.share({
        message: `Check out this post: https://yourapp.com/posts/${postId}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
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
      zIndex={2}
      alignItems="flex-end"
    >
      <LikeAction
        postId={postId}
        endpoint={endpoint}
        initialHasLiked={stats.hasLiked}
        count={stats.likes}
      />
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
