import React, { useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import type {
  CameraPictureOptions,
  CameraRecordingOptions,
  CameraType,
  FlashMode,
} from "expo-camera/next";
import { CameraView, useCameraPermissions } from "expo-camera/next";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { X, Zap, ZapOff } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const CameraScreen = () => {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isRecording, setIsRecording] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [lastScale, setLastScale] = useState(1);

  const [permission, requestPermission] = useCameraPermissions();

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

  const handlePressIn = async () => {
    setIsRecording(true);
    if (cameraRef.current) {
      const options: CameraRecordingOptions = {
        maxDuration: 60,
      };
      const video = await cameraRef.current.recordAsync(options);
      setIsRecording(false);

      if (video === undefined) {
        return;
      }

      router.push({
        pathname: "/preview",
        params: { uri: video.uri, type: "video" },
      });
    }
  };

  const handlePressOut = () => {
    setIsRecording(false);
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const options: CameraPictureOptions = {
        quality: 0.7,
        base64: true,
        exif: true,
      };
      const picture = await cameraRef.current.takePictureAsync(options);

      if (picture === undefined) {
        return;
      }

      router.push({
        pathname: "/preview",
        params: { uri: picture.uri, type: "image" },
      });
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
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

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
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={handleTakePicture}
                  >
                    <View style={styles.takePictureButton} />
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
  takePictureButton: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: "blue",
  },
});

export default CameraScreen;
