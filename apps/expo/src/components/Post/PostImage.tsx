import React, { useEffect, useState } from "react";
import Animated from "react-native-reanimated";
import { Image } from "expo-image";
import { getToken } from "tamagui";

import { Circle, View } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface PostImageProps {
  post: Post["post"];
  stats: Post["postStats"];
}

export const PostImage = (props: PostImageProps) => {
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsImageLoading(false);
    };
  }, []);

  return (
    <View>
      <Animated.View sharedTransitionTag={`post-image-${props.post.id}`}>
        <Image
          recyclingKey={props.post.id}
          source={{ uri: props.post.assetUrl }}
          cachePolicy="memory-disk"
          style={{
            width: "100%",
            aspectRatio: props.post.width / props.post.height,
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
      </Animated.View>
    </View>
  );
};
