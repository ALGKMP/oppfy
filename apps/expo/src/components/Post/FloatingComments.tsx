import React, { useEffect, useRef } from "react";
import { Dimensions } from "react-native";
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

interface Comment {
  id: string;
  username: string;
  content: string;
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
  }, []);

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
}: {
  comments: Comment[];
  isViewable: boolean;
}) => {
  const [visibleComments, setVisibleComments] = React.useState<Comment[]>([]);
  const commentQueue = useRef<Comment[]>([...comments]);
  const isAnimating = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showNextComment = React.useCallback(() => {
    if (commentQueue.current.length > 0 && !isAnimating.current && isViewable) {
      isAnimating.current = true;
      const nextComment = commentQueue.current.shift();
      if (nextComment) {
        setVisibleComments((prev) => [...prev, nextComment].slice(-1)); // Show only 1 at a time
      }
    }
  }, [isViewable]);

  const handleAnimationComplete = React.useCallback(() => {
    isAnimating.current = false;
    setVisibleComments((prev) => prev.slice(1));
    timeoutRef.current = setTimeout(showNextComment, 1000);
  }, [showNextComment]);

  useEffect(() => {
    if (isViewable) {
      commentQueue.current = [...comments];
      showNextComment();
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setVisibleComments([]);
      isAnimating.current = false;
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isViewable, comments]);

  if (!isViewable) return null;

  return (
    <View pointerEvents="none">
      {visibleComments.map((comment) => (
        <FloatingComment
          key={comment.id}
          comment={comment}
          onAnimationComplete={handleAnimationComplete}
        />
      ))}
    </View>
  );
};
