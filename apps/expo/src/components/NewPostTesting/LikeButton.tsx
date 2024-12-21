import { TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { Heart } from "@tamagui/lucide-icons";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useCallback } from "react";
import { useLikePost } from "./hooks/useLikePost";

interface LikeButtonProps {
  postId: string;
  endpoint: "self-profile" | "other-profile" | "home-feed" | "single-post";
  userId: string;
}

const LikeButton = ({ postId, endpoint, userId }: LikeButtonProps) => {
  const buttonLikeScale = useSharedValue(1);

  const { hasLiked, handleLikePressed, handleLikeDoubleTapped } = useLikePost({
    postId,
    endpoint,
    userId,
  });

  const heartButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonLikeScale.value }],
    };
  });

  const handleLikePress = useCallback(() => {
    handleLikePressed();
    buttonLikeScale.value = withSpring(
      1.2,
      {
        damping: 10,
        stiffness: 200,
      },
      () => {
        buttonLikeScale.value = withSpring(1, {
          damping: 10,
          stiffness: 200,
        });
      },
    );
  }, [buttonLikeScale]);

  return (
    <TouchableOpacity onPress={handleLikePress}>
      <Animated.View style={[heartButtonAnimatedStyle]}>
        <Heart
          size="$2"
          padding="$3"
          color={hasLiked ? "red" : "$gray12"}
          fill="red"
          fillOpacity={hasLiked ? 1 : 0}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default LikeButton;
