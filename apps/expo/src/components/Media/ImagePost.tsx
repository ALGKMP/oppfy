import React, { useEffect } from "react";
import { processColorsInProps } from "react-native-reanimated/lib/typescript/reanimated2/Colors";
import { Image } from "expo-image";
import { PersonStanding } from "@tamagui/lucide-icons";

interface ImagePostProps {
  postId: string;
  imageUrl: string;
  children: React.ReactNode;
}

const ImagePost: React.FC<ImagePostProps> = (props: ImagePostProps) => {
  const { postId, imageUrl, children } = props;
  const postKey = postId.toString();

  return (
    <Image
      source={imageUrl}
      recyclingKey={postKey}
      style={[
        {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 20,
          // borderTopLeftRadius: 20,
          // borderTopRightRadius: 20,
        },
      ]}
      contentFit="cover"
    >
      {children}
    </Image>
  );
};

export default ImagePost;
