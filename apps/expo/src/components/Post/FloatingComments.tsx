import React, { useEffect, useRef } from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "tamagui";

import CommentsBottomSheet from "~/components/Post/Comment/CommentsBottomSheet";
import { useBottomSheetController } from "~/components/ui/BottomSheet";

interface Comment {
  id: string;
  username: string;
  content: string;
}

interface FloatingCommentsProps {
  comments: Comment[];
  isViewable: boolean;
  postId: string;
  endpoint: "self-profile" | "other-profile" | "home-feed" | "single-post";
  postRecipientUserId: string;
}

const FloatingComment = ({
  comment,
  onAnimationComplete,
}: {
  comment: Comment;
  onAnimationComplete: () => void;
}) => {
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: interpolate(opacity.value, [0, 1], [0.97, 1]) },
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    // Smooth fade in
    opacity.value = withSpring(1, {
      mass: 0.4,
      stiffness: 200,
      damping: 15,
    });

    // Float up with deceleration at the end
    translateY.value = withTiming(0, {
      duration: 1200,
      easing: Easing.bezier(0.22, 1, 0.36, 1), // Custom easing for smooth deceleration
    });

    // Hold position then fade out
    const fadeTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: 400,
          easing: Easing.out(Easing.ease),
        },
        () => {
          runOnJS(onAnimationComplete)();
        },
      );
    }, 1500); // Longer hold before fade

    return () => clearTimeout(fadeTimer);
  }, [onAnimationComplete, opacity, translateY]);

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0.65)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 12,
          paddingVertical: 6,
          paddingHorizontal: 12,
          alignSelf: "flex-start",
          maxWidth: Dimensions.get("window").width * 0.75,
        }}
      >
        <Text
          color="white"
          fontSize={14}
          style={{
            textShadowColor: "rgba(0,0,0,0.3)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          <Text color="$primary" fontWeight="600">
            {comment.username}
          </Text>{" "}
          {comment.content}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

export const FloatingComments = ({
  comments,
  isViewable,
  postId,
  endpoint,
  postRecipientUserId,
}: FloatingCommentsProps) => {
  const [visibleComments, setVisibleComments] = React.useState<Comment[]>([]);
  const [isCurrentlyAnimating, setIsCurrentlyAnimating] = React.useState(false);
  const commentQueue = useRef<Comment[]>([...comments]);
  const isAnimating = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasStartedRef = useRef(false);
  const { show, hide } = useBottomSheetController();

  const showNextComment = React.useCallback(() => {
    if (commentQueue.current.length > 0 && !isAnimating.current) {
      isAnimating.current = true;
      setIsCurrentlyAnimating(true);
      const nextComment = commentQueue.current.shift();
      if (nextComment) {
        setVisibleComments((prev) => [...prev, nextComment].slice(-1));
      }
    }
  }, []);

  const handleAnimationComplete = React.useCallback(() => {
    isAnimating.current = false;
    setIsCurrentlyAnimating(false);
    setVisibleComments((prev) => prev.slice(1));

    // Only schedule next comment if we're still viewable
    if (commentQueue.current.length > 0 && isViewable) {
      timeoutRef.current = setTimeout(showNextComment, 1000);
    }
  }, [isViewable, showNextComment]);

  useEffect(() => {
    if (isViewable && !hasStartedRef.current) {
      // Only start the animation sequence once when becoming viewable
      hasStartedRef.current = true;
      commentQueue.current = [...comments];
      showNextComment();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isViewable, comments, showNextComment]);

  const handlePress = () => {
    show({
      snapPoints: ["100%"],
      title: "Comments",
      children: (
        <CommentsBottomSheet
          postId={postId}
          endpoint={endpoint}
          postRecipientUserId={postRecipientUserId}
          onHideBottomSheet={hide}
        />
      ),
    });
  };

  // Only return null if we're not viewable AND have no active animations
  if (!isViewable && !visibleComments.length && !isCurrentlyAnimating)
    return null;

  return (
    <TouchableOpacity onPress={handlePress}>
      <View pointerEvents="none">
        {visibleComments.map((comment) => (
          <FloatingComment
            key={comment.id}
            comment={comment}
            onAnimationComplete={handleAnimationComplete}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
};
