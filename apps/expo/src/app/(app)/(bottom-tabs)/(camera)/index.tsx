import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  GestureEvent,
  GestureHandlerRootView,
  PinchGestureHandler,
  PinchGestureHandlerEventPayload,
  State,
  TapGestureHandler,
} from "react-native-gesture-handler";
import { CameraType, CameraView, FlashMode } from "expo-camera/next";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { X, Zap, ZapOff } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const Camera = () => {
  const router = useRouter();

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isRecording, setIsRecording] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [lastScale, setLastScale] = useState(1);

  function handleDoubleTap() {
    toggleCameraFacing();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function toggleFlashlight() {
    setFlash((current) => (current === "off" ? "on" : "off"));
  }

  function handlePressIn() {
    setIsRecording(true);
    // Start recording logic here
  }

  function handlePressOut() {
    setIsRecording(false);
    // Stop recording logic here
  }

  const handlePinchEvent = (
    event: GestureEvent<PinchGestureHandlerEventPayload>,
  ) => {
    const scale = event.nativeEvent.scale;
    const newZoom = Math.min(Math.max(zoom + (scale - lastScale) * 0.2, 0), 1);
    setZoom(newZoom);
    setLastScale(scale);
  };

  const handlePinchStateChange = (
    event: GestureEvent<PinchGestureHandlerEventPayload>,
  ) => {
    if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED
    ) {
      setLastScale(1);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PinchGestureHandler
        onGestureEvent={handlePinchEvent}
        onHandlerStateChange={handlePinchStateChange}
      >
        <TapGestureHandler
          onActivated={handleDoubleTap}
          numberOfTaps={2}
          maxDist={20}
        >
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              facing={facing}
              flash={flash}
              zoom={zoom}
            >
              <BaseScreenView
                paddingVertical={0}
                safeAreaEdges={["top", "bottom"]}
                justifyContent="space-between"
                backgroundColor={"$backgroundTransparent"}
              >
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1}>
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    padding={10}
                  >
                    <TouchableOpacity
                      hitSlop={10}
                      onPress={() => router.back()}
                    >
                      <X />
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} onPress={toggleFlashlight}>
                      {flash === "on" ? <Zap fill={"white"} /> : <ZapOff />}
                    </TouchableOpacity>
                  </XStack>
                </TouchableOpacity>

                <XStack justifyContent="center">
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <View
                      style={
                        isRecording ? styles.recording : styles.notRecording
                      }
                    />
                  </TouchableOpacity>
                </XStack>
              </BaseScreenView>
            </CameraView>
          </View>
        </TapGestureHandler>
      </PinchGestureHandler>
    </GestureHandlerRootView>
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
