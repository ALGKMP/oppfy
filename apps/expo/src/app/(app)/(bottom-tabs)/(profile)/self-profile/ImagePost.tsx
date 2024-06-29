import React from "react";
import Animated from "react-native-reanimated";
import { Image } from "expo-image";
import { Heart } from "@tamagui/lucide-icons";
import type { StyleProp, ViewStyle } from "react-native";

interface ImagePostProps {
  imageUrl: string;
  animatedHeartImageStyle: StyleProp<ViewStyle>;
}

const ImagePost: React.FC<ImagePostProps> = ({
  imageUrl,
  animatedHeartImageStyle,
}) => {
  return (
    <Image
      source={{ uri: imageUrl }}
      style={[
        {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 20,
        },
      ]}
      contentFit="cover"
    >
      <Animated.View style={[animatedHeartImageStyle]}>
        <Heart size={100} color="red" fill="red" />
      </Animated.View>
    </Image>
  );
};

export default ImagePost;
