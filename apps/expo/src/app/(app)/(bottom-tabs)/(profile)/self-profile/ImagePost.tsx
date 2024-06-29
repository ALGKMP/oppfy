import React, { useCallback } from "react";
import { Image } from "expo-image";
import { Heart } from "@tamagui/lucide-icons";

interface ImagePostProps {
  imageUrl: string;
  children: React.ReactNode;
}

const ImagePost: React.FC<ImagePostProps> = ({ imageUrl, children }) => {
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
      {children}
    </Image>
  );
};

export default ImagePost;
