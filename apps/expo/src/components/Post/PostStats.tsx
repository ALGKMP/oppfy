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
import type { RouterOutputs } from "~/utils/api";
import { Icon } from "../ui";
import { useLike } from "./hooks/useLike";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface PostStatsProps {
  postId: string;
  recipientUserId: string;
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
      gap="$5"
      zIndex={3}
      alignItems="flex-end"
    >
      <LikeAction
        postId={props.postId}
        postStats={props.postStats}
        isLiked={props.isLiked}
      />
      {/* <CommentAction
        postId={props.postId}
        recipientUserId={props.recipientUserId}
        count={props.postStats.comments}
      /> */}
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
    <StatButton count={postStats.likes}>
      <Animated.View style={buttonScale}>
        <Icon
          name="heart"
          onPress={handlePress}
          color={isLiked ? "#ff3b30" : "white"}
        />
      </Animated.View>
    </StatButton>
  );
};

// const CommentAction = ({
//   postId,
//   endpoint,
//   recipientUserId,
//   count,
// }: {
//   postId: string;
//   endpoint: PostStatsProps["endpoint"];
//   recipientUserId: string;
//   count: number;
// }) => {
//   const { buttonScale, animate } = useButtonAnimation();
//   const { show, hide } = useBottomSheetController();

//   const handlePress = () => {
//     animate();
//     show({
//       snapPoints: ["100%"],
//       title: "Comments",
//       children: (
//         <CommentsBottomSheet
//           postId={postId}
//           endpoint={endpoint}
//           postRecipientUserId={recipientUserId}
//           onHideBottomSheet={hide}
//         />
//       ),
//     });
//   };

//   return (
//     <StatButton count={count}>
//       <Animated.View style={buttonScale}>
//         <Icon name="chatbubble-outline" onPress={handlePress} color="white" />
//       </Animated.View>
//     </StatButton>
//   );
// };

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
