import React, { useState } from "react";
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraType, CameraView, FlashMode } from "expo-camera/next";
import { useRouter } from "expo-router";
import { X, Zap, ZapOff } from "@tamagui/lucide-icons";
import { Text, View, XStack } from "tamagui";

import { Header } from "~/components/Headers";
import { BaseScreenView } from "~/components/Views";

const Camera = () => {
  const router = useRouter();

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [zoom, setZoom] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  let lastTap: number | null = null;

  function handleDoubleTap() {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      toggleCameraFacing();
    } else {
      lastTap = now;
    }
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function toggleFlashlight() {
    setFlash((current) => (current === "off" ? "on" : "off"));
  }

  function handleZoom(
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) {
    if (gestureState.dy > 0) {
      setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0));
    } else {
      setZoom((prevZoom) => Math.min(prevZoom + 0.1, 1));
    }
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: handleZoom,
  });

  function handlePressIn() {
    setIsRecording(true);
    // Start recording
  }

  function handlePressOut() {
    setIsRecording(false);
    // Stop recording
  }

  return (
    <CameraView style={{ flex: 1 }} facing={facing} flash={flash} zoom={zoom}>
      <BaseScreenView
        paddingVertical={0}
        safeAreaEdges={["top", "bottom"]}
        justifyContent="space-between"
        backgroundColor={"$backgroundTransparent"}
      >
        <XStack alignItems="center" justifyContent="space-between">
          <View>
            <TouchableOpacity hitSlop={10} onPress={() => router.back()}>
              <X />
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity hitSlop={10} onPress={toggleFlashlight}>
              {flash === "on" ? <Zap fill={"white"} /> : <ZapOff />}
            </TouchableOpacity>
          </View>
        </XStack>

        <XStack justifyContent="center" {...panResponder.panHandlers}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleDoubleTap}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View
              style={isRecording ? styles.recording : styles.notRecording}
            />
          </TouchableOpacity>
        </XStack>
      </BaseScreenView>
    </CameraView>
  );
};

const styles = StyleSheet.create({
  cameraButton: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  recording: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: "red",
  },
  notRecording: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "red",
  },
});

export default Camera;
