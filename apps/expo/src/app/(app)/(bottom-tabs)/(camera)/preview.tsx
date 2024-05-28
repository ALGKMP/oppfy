// src/features/connections/screens/PreviewScreen.tsx
import React, { useRef, useState } from "react";
import { Button, StyleSheet, View } from "react-native";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { XStack } from "tamagui";

const PreviewScreen = () => {
  const router = useRouter();
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "image" | "video";
  }>();
  const videoRef = useRef(null);
  const [_status, setStatus] = useState({});

  return (
    <View style={styles.container}>
      {type === "image" ? (
        <Image source={{ uri }} style={styles.media} />
      ) : (
        <Video
          ref={videoRef}
          style={styles.media}
          source={{ uri }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />
      )}
      <XStack justifyContent="space-between" padding={10}>
        <Button title="Retake" onPress={() => router.back()} />
        <Button title="Next" onPress={() => null} />
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
