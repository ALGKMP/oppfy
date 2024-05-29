import React, { useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import type {
  GestureEvent,
  PinchGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  State,
  TapGestureHandler,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CameraType, FlashMode } from "expo-camera";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { X, Zap, ZapOff } from "@tamagui/lucide-icons";
import { Button, Text, View, XStack } from "tamagui";

const CameraScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const cameraRef = useRef<CameraView>(null);
  const animation = useRef(new Animated.Value(0)).current;

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isRecording, setIsRecording] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [lastScale, setLastScale] = useState(1);
  const [mode, setMode] = useState<"picture" | "video">("picture");

  const [permission, requestPermission] = useCameraPermissions();
  const [pressTimeout, setPressTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleDoubleTap = () => {
    toggleCameraFacing();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlashlight = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const options = {
        base64: true,
        exif: true,
      };
      const picture = await cameraRef.current.takePictureAsync(options);

      if (picture !== undefined) {
        router.push({
          pathname: "/preview",
          params: { uri: picture.uri, type: "image" },
        });
      }
    }
  };

  const handleStartRecording = async () => {
    if (cameraRef.current) {
      setMode("video");
      setIsRecording(true);
      const options = {
        maxDuration: 60,
      };
      const video = await cameraRef.current.recordAsync(options);
      if (video?.uri) {
        router.push({
          pathname: "/preview",
          params: { uri: video.uri, type: "video" },
        });
      }
    }
  };

  const handlePressIn = () => {
    setPressTimeout(
      setTimeout(() => {
        void handleStartRecording();
        Animated.timing(animation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }, 200),
    );
  };

  const handlePressOut = () => {
    if (pressTimeout) {
      clearTimeout(pressTimeout);
      setPressTimeout(null);
    }

    if (isRecording) {
      cameraRef.current?.stopRecording();
      setIsRecording(false);
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      void handleTakePicture();
    }
  };

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

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission}>Grant Permission</Button>
      </View>
    );
  }

  const animatedButtonStyle = {
    backgroundColor: animation.interpolate({
      inputRange: [0, 1],
      outputRange: ["white", "red"],
    }),
    borderColor: animation.interpolate({
      inputRange: [0, 1],
      outputRange: ["red", "white"],
    }),
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
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={facing}
              flash={flash}
              zoom={zoom}
              mode={mode}
            >
              <View
                flex={1}
                paddingTop={insets.top}
                paddingBottom={insets.bottom}
                paddingHorizontal="$5"
                backgroundColor="transparent"
                justifyContent="space-between"
              >
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1}>
                  <XStack alignItems="center" justifyContent="space-between">
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
                    <Animated.View
                      style={[styles.innerButton, animatedButtonStyle]}
                    />
                  </TouchableOpacity>
                </XStack>
              </View>
            </CameraView>
          </View>
        </TapGestureHandler>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 20,
  },
  cameraButton: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },
  innerButton: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  recording: {
    backgroundColor: "red",
    borderColor: "white",
  },
  notRecording: {
    backgroundColor: "transparent",
    borderColor: "red",
  },
});

export default CameraScreen;
