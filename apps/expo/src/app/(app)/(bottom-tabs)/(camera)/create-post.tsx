import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

const CreatePost = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
  }>();

  return (
    <View>
      <Text>CreatePost</Text>
    </View>
  );
};

export default CreatePost;
