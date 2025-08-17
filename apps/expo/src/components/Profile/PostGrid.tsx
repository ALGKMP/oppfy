import React from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { getToken, View } from "tamagui";

import type { RouterOutputs } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface PostGridItemProps {
  post: Post;
  onPress: (post: Post) => void;
  size: number;
}

const PostGridItem = ({ post, onPress, size }: PostGridItemProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { duration: 150 });
    opacity.value = withTiming(0.8, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(post)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={animatedStyle}>
        <Animated.View sharedTransitionTag={`post-image-${post.post.id}`}>
          <Image
            source={{ uri: post.post.assetUrl }}
            style={{
              width: size,
              height: size,
              borderRadius: getToken("$4", "radius") as number,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={post.post.id}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface PostGridProps {
  posts: Post[];
  onPostPress: (post: Post) => void;
  paddingHorizontal?: number;
}

export const PostGrid = ({
  posts,
  onPostPress,
  paddingHorizontal = 20,
}: PostGridProps) => {
  const screenWidth = Dimensions.get("window").width;
  const gap = 8;
  const itemSize = (screenWidth - paddingHorizontal * 2 - gap) / 2;

  return (
    <View
      paddingHorizontal={paddingHorizontal}
      flexDirection="row"
      flexWrap="wrap"
      gap={gap}
    >
      {posts.map((post, index) => (
        <PostGridItem
          key={post.post.id}
          post={post}
          onPress={onPostPress}
          size={itemSize}
        />
      ))}
    </View>
  );
};
