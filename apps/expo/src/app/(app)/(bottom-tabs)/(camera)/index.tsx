import React, { useRef, useState } from "react";
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraType, CameraView, FlashMode } from "expo-camera/next";
import { useRouter } from "expo-router";
import { X, Zap, ZapOff } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_RADIUS = 50;

const Camera = () => {
  const router = useRouter();

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [zoom, setZoom] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  function handleDoubleTap(event: GestureResponderEvent) {
    const { locationX, locationY } = event.nativeEvent;
    const now = Date.now();

    if (lastTapRef.current) {
      const { x, y, time } = lastTapRef.current;
      const timeDiff = now - time;
      const distance = Math.sqrt(
        Math.pow(locationX - x, 2) + Math.pow(locationY - y, 2),
      );

      if (timeDiff < DOUBLE_TAP_DELAY && distance < DOUBLE_TAP_RADIUS) {
        toggleCameraFacing();
        lastTapRef.current = null;
        if (doubleTapTimeoutRef.current) {
          clearTimeout(doubleTapTimeoutRef.current);
        }
        return;
      }
    }

    lastTapRef.current = { x: locationX, y: locationY, time: now };
    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current);
    }
    doubleTapTimeoutRef.current = setTimeout(() => {
      lastTapRef.current = null;
    }, 300);
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
    // Start recording logic here
  }

  function handlePressOut() {
    setIsRecording(false);
    // Stop recording logic here
  }

  return (
    <CameraView
      style={{ flex: 1 }}
      facing={facing}
      flash={flash}
      zoom={zoom}
      {...panResponder.panHandlers}
    >
      <BaseScreenView
        paddingVertical={0}
        safeAreaEdges={["top", "bottom"]}
        justifyContent="space-between"
        backgroundColor={"$backgroundTransparent"}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleDoubleTap}
          delayLongPress={300}
        >
          <XStack
            alignItems="center"
            justifyContent="space-between"
            padding={10}
          >
            <TouchableOpacity hitSlop={10} onPress={() => router.back()}>
              <X />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={10} onPress={toggleFlashlight}>
              {flash === "on" ? <Zap fill={"white"} /> : <ZapOff />}
            </TouchableOpacity>
          </XStack>

          <View style={styles.zoomContainer}>
            {/* This view is for handling the zoom gestures */}
          </View>

          <XStack justifyContent="center" style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <View
                style={isRecording ? styles.recording : styles.notRecording}
              />
            </TouchableOpacity>
          </XStack>
        </TouchableOpacity>
      </BaseScreenView>
    </CameraView>
  );
};

const styles = StyleSheet.create({
  zoomContainer: {
    flex: 1,
    backgroundColor: "transparent", // Ensure this doesn't take up visible space
  },
  buttonContainer: {
    position: "absolute",
    bottom: 30, // Adjust as needed for the desired distance from the bottom
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
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
