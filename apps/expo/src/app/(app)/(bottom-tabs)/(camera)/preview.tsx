import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const PreviewScreen = () => {
  const router = useRouter();
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "image" | "video";
  }>();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => {
        Animated.timing(controlFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [controlFadeAnim, showControls]);

  const togglePlayback = () => {
    if (status?.isLoaded && status.isPlaying) {
      void videoRef.current?.pauseAsync();
    } else {
      void videoRef.current?.playAsync();
    }
    setShowControls(true);
    controlFadeAnim.setValue(1);
  };

  const handleVideoPress = () => {
    setShowControls(true);
    controlFadeAnim.setValue(1);
    togglePlayback();
  };

  return (
    <BaseScreenView
      paddingVertical={0}
      safeAreaEdges={["top", "bottom"]}
      justifyContent="space-between"
      backgroundColor={"$backgroundTransparent"}
      style={styles.container}
    >
      {type === "image" ? (
        <Image source={{ uri }} style={styles.media} />
      ) : (
        <View style={styles.videoContainer}>
          <TouchableOpacity
            style={styles.videoTouchArea}
            onPress={handleVideoPress}
            activeOpacity={1}
          >
            <Video
              ref={videoRef}
              style={styles.media}
              source={{ uri }}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              onPlaybackStatusUpdate={(status) => setStatus(status)}
            />
            {showControls && (
              <Animated.View
                style={[styles.playButton, { opacity: controlFadeAnim }]}
              >
                <Ionicons
                  name={status?.isLoaded && status.isPlaying ? "pause" : "play"}
                  size={48}
                  color="white"
                />
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      )}
      <XStack
        justifyContent="space-between"
        padding={20}
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => null}>
          <Ionicons name="arrow-forward" size={24} color="white" />
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </XStack>
    </BaseScreenView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  media: {
    width: "100%",
    height: "80%",
    borderRadius: 10,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    height: "80%",
  },
  videoTouchArea: {
    flex: 1,
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 48,
    padding: 10,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
  },
});

export default PreviewScreen;
