import React, { useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { XStack, Text, View } from "tamagui";

interface Comment {
  id: string;
  username: string;
  content: string;
  profilePicture?: string;
}

interface FloatingCommentProps {
  comment: Comment;
  onAnimationComplete: () => void;
}

const FloatingComment = ({ comment, onAnimationComplete }: FloatingCommentProps) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: interpolate(opacity.value, [0, 0.5, 1], [0.8, 1.1, 1]) }
      ],
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    opacity.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 100 }),
      withTiming(0, { 
        duration: 3000,
        easing: Easing.out(Easing.ease)
      }, () => {
        runOnJS(onAnimationComplete)();
      })
    );

    translateY.value = withTiming(-100, { duration: 4000 });
  }, []);

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute', bottom: 120, left: 16 }]}>
      <XStack
        gap="$2"
        alignItems="center"
        maxWidth={Dimensions.get('window').width * 0.7}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Text
            color="white"
            fontWeight="600"
            fontSize="$3"
            style={{
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            <Text color="$primary">{comment.username}</Text>
            {" "}
            {comment.content}
          </Text>
        </LinearGradient>
      </XStack>
    </Animated.View>
  );
};

interface FloatingCommentsProps {
  comments: Comment[];
}

export const FloatingComments = ({ comments }: FloatingCommentsProps) => {
  const [visibleComments, setVisibleComments] = React.useState<Comment[]>([]);
  const commentQueue = useRef<Comment[]>([...comments]);
  const isAnimating = useRef(false);

  const showNextComment = React.useCallback(() => {
    if (commentQueue.current.length > 0 && !isAnimating.current) {
      isAnimating.current = true;
      const nextComment = commentQueue.current.shift();
      if (nextComment) {
        setVisibleComments(prev => [...prev, nextComment].slice(-3));
      }
    }
  }, []);

  const handleAnimationComplete = React.useCallback(() => {
    isAnimating.current = false;
    setVisibleComments(prev => prev.slice(1));
    setTimeout(showNextComment, Math.random() * 2000 + 1000); // Random delay between comments
  }, [showNextComment]);

  useEffect(() => {
    showNextComment();
  }, []);

  return (
    <View
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      height={200}
      zIndex={3}
      pointerEvents="none"
    >
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