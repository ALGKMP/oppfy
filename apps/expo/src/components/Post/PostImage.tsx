import React, { useCallback, useEffect, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { Image } from "expo-image";
import { getToken } from "tamagui";

import { Circle, View } from "~/components/ui";
import { useLikePost } from "~/hooks/post/useLikePost";
import GradientHeart, { useHeartAnimations } from "../Icons/GradientHeart";
import type { PostMediaProps } from "./types";

export const PostImage = ({
  endpoint,
  media,
  stats,
  isViewable,
}: PostMediaProps) => {
  const { handleLikeDoubleTapped } = useLikePost({
    postId: media.id,
    endpoint,
    userId: media.recipient.id,
    initialHasLiked: stats.hasLiked,
  });
  const { hearts, addHeart } = useHeartAnimations();
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsImageLoading(false);
    };
  }, []);

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      addHeart(x, y);
      handleLikeDoubleTapped();
    },
    [addHeart, handleLikeDoubleTapped],
  );

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      runOnJS(handleDoubleTap)(event.x, event.y);
    });

  return (
    <GestureDetector gesture={doubleTap}>
      <View>
        <Image
          source={{ uri: media.url }}
          recyclingKey={media.id}
          cachePolicy="memory-disk"
          style={{
            width: "100%",
            aspectRatio: media.dimensions.width / media.dimensions.height,
            borderRadius: getToken("$8", "radius") as number,
          }}
          contentFit="cover"
          transition={0}
          onLoadStart={() => setIsImageLoading(true)}
          onLoad={() => setIsImageLoading(false)}
        />
        {isImageLoading && (
          <View
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            justifyContent="center"
            alignItems="center"
            backgroundColor="rgba(0, 0, 0, 0.1)"
          >
            <Circle size={48} borderWidth={2} borderColor="$gray11" />
          </View>
        )}
        {hearts.map((heart) => (
          <GradientHeart
            key={heart.id}
            gradient={heart.gradient}
            position={heart.position}
          />
        ))}
      </View>
    </GestureDetector>
  );
};
