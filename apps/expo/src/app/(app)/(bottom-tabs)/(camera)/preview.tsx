import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AVPlaybackStatus } from "expo-av";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { PermissionStatus } from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ArrowBigRight, Download, X } from "@tamagui/lucide-icons";
import { Button, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";

type SaveState = "idle" | "saving" | "saved";

const PreviewScreen = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
  }>();

  const router = useRouter();

  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const controlFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => {
        Animated.timing(controlFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [controlFadeAnim, showControls]);

  const openSettings = async () => {
    await Linking.openSettings();
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === PermissionStatus.GRANTED) {
      return true;
    }

    Alert.alert(
      "Media Library Permission",
      "Media library permission is required for this app. Please enable it in your device settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: void openSettings },
      ],
    );

    return false;
  };

  const togglePlayback = () => {
    if (!status?.isLoaded) return;

    status.isPlaying
      ? videoRef.current?.pauseAsync()
      : videoRef.current?.playAsync();

    setShowControls(true);
    controlFadeAnim.setValue(1);
  };

  const handleVideoPress = () => {
    setShowControls(true);
    controlFadeAnim.setValue(1);
    togglePlayback();
  };

  const saveToCameraRoll = async () => {
    setSaveState("saving");

    const hasPermission = await requestMediaLibraryPermission();

    if (!hasPermission) {
      setSaveState("idle");
      return;
    }

    await MediaLibrary.createAssetAsync(uri);
    setSaveState("saved");
  };

  return (
    <BaseScreenView
      padding={0}
      safeAreaEdges={["bottom"]}
      justifyContent="space-between"
      backgroundColor={"$backgroundTransparent"}
      style={styles.container}
    >
      <Header />
      {type === "photo" ? (
        <Image
          source={{ uri }}
          style={{
            flex: 1,
          }}
        />
      ) : (
        <TouchableOpacity
          style={styles.videoTouchArea}
          onPress={handleVideoPress}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            style={styles.media}
            source={{ uri }}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
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
      )}
      <XStack
        justifyContent="space-evenly"
        paddingTop="$4"
        paddingHorizontal="$6"
        backgroundColor={"$background"}
        gap="$6"
      >
        <Button
          flex={1}
          size={"$5"}
          borderRadius="$8"
          iconAfter={Download}
          onPress={saveToCameraRoll}
          disabled={saveState === "saving" || saveState === "saved"}
          disabledStyle={{
            opacity: 0.5,
          }}
        >
          {saveState === "saving" ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            "Save"
          )}
        </Button>
        <Button
          flex={2}
          size={"$5"}
          borderRadius="$8"
          iconAfter={ArrowBigRight}
        >
          Continue
        </Button>
      </XStack>
    </BaseScreenView>
  );
};

const Header = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        zIndex: 1,
      }}
    >
      <TouchableOpacity hitSlop={10} onPress={() => router.back()}>
        <X size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  media: {
    width: "100%",
    height: "100%",
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
});

export default PreviewScreen;
