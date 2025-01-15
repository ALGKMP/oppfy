import { TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Heart } from "@tamagui/lucide-icons";
import { YStack } from "tamagui";

import { useLikePost } from "~/hooks/post/useLikePost";
import { api } from "~/utils/api";
import { Text } from "../ui";

interface LikeButtonProps {
  postId: string;
  endpoint: "self-profile" | "other-profile" | "home-feed" | "single-post";
  initialHasLiked: boolean;
  light?: boolean;
  compact?: boolean;
}

const LikeButton = ({
  postId,
  endpoint,
  initialHasLiked,
  light,
  compact,
}: LikeButtonProps) => {
  const buttonLikeScale = useSharedValue(1);
  const { handleLikePressed, handleLikeDoubleTapped, hasLiked } = useLikePost({
    postId,
    endpoint,
    initialHasLiked,
  });

  const heartButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonLikeScale.value }],
  }));

  const handleLikePress = () => {
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
  };

  return (
    <TouchableOpacity
      onPress={handleLikePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={[heartButtonAnimatedStyle]}>
        <Heart
          size={compact ? 20 : 26}
          color={hasLiked ? "#ff3b30" : light ? "white" : "$gray12"}
          fill={hasLiked ? "#ff3b30" : "transparent"}
          style={{
            transform: [{ scale: hasLiked ? 1.1 : 1 }],
            shadowColor: "black",
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default LikeButton;
