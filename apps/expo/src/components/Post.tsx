import React from "react";
import { ImageSourcePropType } from "react-native";
import { Text, View } from "tamagui";

interface PostData {
  id: string;

  authorUsername: string;

  recipientUsername: string;
  recipientProfilePicture: ImageSourcePropType | string | null;

  mediaType: "video" | "image";
  mediaUrl: string;

  caption: string;

  createdAt: string;
}

interface PostProps {
  post: PostData;
}

const Post = (props: PostProps) => {
  return (
    <View>
      <Text>Post</Text>
    </View>
  );
};

export default Post;
