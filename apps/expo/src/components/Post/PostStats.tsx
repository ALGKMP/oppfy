import React, { useCallback } from "react";
import { Share, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { getTokens, Text, XStack, YStack } from "tamagui";

import CommentsBottomSheet from "~/components/Post/Comment/CommentsBottomSheet";
import { useBottomSheetController } from "~/components/ui/BottomSheet";
import useShare from "~/hooks/useShare";
import type { RouterOutputs } from "~/utils/api";
import { Icon } from "../ui";
import { useLike } from "./hooks/useLike";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface PostStatsProps {
  postId: string;
  postAuthorUserId: string;
  postRecipientUserId: string;
  postStats: Post["postStats"];
  isLiked: boolean;
}

export const PostStats = (props: PostStatsProps) => {
  return (
    <YStack
      position="absolute"
      right={0}
      bottom={24}
      paddingRight="$4"
      gap="$3"
      zIndex={3}
      alignItems="flex-end"
    >
      <LikeAction
        postId={props.postId}
        postStats={props.postStats}
        isLiked={props.isLiked}
      />
      <CommentAction
        postId={props.postId}
        postAuthorUserId={props.postAuthorUserId}
        postRecipientUserId={props.postRecipientUserId}
        count={props.postStats.comments}
      />
      <ShareAction postId={props.postId} />
    </YStack>
  );
};

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

interface LikeActionProps {
  postId: string;
  postStats: PostStatsProps["postStats"];
  isLiked: boolean;
}

const LikeAction = ({ postId, postStats, isLiked }: LikeActionProps) => {
  const { buttonScale, animate } = useButtonAnimation();

  const { likePost, unlikePost } = useLike({
    postId,
  });

  const handlePress = async () => {
    animate();
    isLiked ? void unlikePost() : void likePost();
  };

  return (
    <StatButton count={postStats.likes} onPress={handlePress}>
      <Animated.View style={buttonScale}>
        <Text fontSize={30}>{isLiked ? "❤️‍🔥" : "❤️"}</Text>
      </Animated.View>
    </StatButton>
  );
};

interface CommentActionProps {
  postId: string;
  postAuthorUserId: string;
  postRecipientUserId: string;
  count: number;
}

const CommentAction = ({
  postId,
  postAuthorUserId,
  postRecipientUserId,
  count,
}: CommentActionProps) => {
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
          postAuthorId={postAuthorUserId}
          postRecipientId={postRecipientUserId}
          onHide={hide}
        />
      ),
    });
  };

  return (
    <StatButton count={count} onPress={handlePress}>
      <Animated.View style={buttonScale}>
        <Icon name="chatbubble-outline" color="white" size={30} disabled />
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
    <StatButton onPress={handlePress} label="Send">
      <Animated.View style={buttonScale}>
        <Icon
          name="paper-plane-outline"
          color="white"
          size={30}
          disabled
          iconStyle={{ marginRight: 2.5 }}
        />
      </Animated.View>
    </StatButton>
  );
};

const StatButton = ({
  count,
  children,
  onPress,
  label,
}: {
  count?: number;
  children: React.ReactNode;
  onPress?: () => void;
  backgroundColor?: string;
  label?: string;
}) => {
  const formatCount = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <YStack alignItems="center" gap="$1">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          width: 48,
          height: 48,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {children}
      </TouchableOpacity>
      {count !== undefined && count > 0 && (
        <Text
          color="white"
          fontWeight="bold"
          fontSize="$2"
          textAlign="center"
          style={{
            textShadowColor: "rgba(0, 0, 0, 0.75)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {formatCount(count)}
        </Text>
      )}
      {label && (
        <Text
          color="white"
          fontWeight="bold"
          fontSize="$2"
          textAlign="center"
          style={{
            textShadowColor: "rgba(0, 0, 0, 0.75)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {label}
        </Text>
      )}
    </YStack>
  );
};
