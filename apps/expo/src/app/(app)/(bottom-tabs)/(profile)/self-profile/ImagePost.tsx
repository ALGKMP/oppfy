import React from "react";
import { Image } from "expo-image";

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
          // borderRadius: 20,
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
