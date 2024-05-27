// src/features/connections/screens/PreviewScreen.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Button, XStack } from "tamagui";

const PreviewScreen = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "image" | "video";
  }>();

  const router = useRouter();

  return (
    <View style={styles.container}>
      {type === "image" ? (
        <Image source={{ uri }} style={styles.media} />
      ) : (
        <Video
          source={{ uri }}
          style={styles.media}
          useNativeControls
          resizeMode="contain"
          isLooping
        />
      )}
      <XStack justifyContent="space-between" padding={10}>
        <Button onPress={() => router.back()}>Retake</Button>
        <Button onPress={() => null}>Next</Button>
      </XStack>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  media: {
    width: "100%",
    height: "80%",
  },
});

export default PreviewScreen;
