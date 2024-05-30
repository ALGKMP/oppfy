import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import type {
  CameraMode,
  CameraProps,
  CameraType,
  FlashMode,
} from "expo-camera/next";
import { CameraView } from "expo-camera/next";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ChevronLeft, X } from "@tamagui/lucide-icons";

import { CaptureButton, StatusBarBlurBackground } from "~/components/camera";
import {
  CONTENT_SPACING,
  CONTROL_BUTTON_SIZE,
  SAFE_AREA_PADDING,
} from "~/constants/camera";

const ReanimatedCamera = Reanimated.createAnimatedComponent(CameraView);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const MIN_ZOOM = 0;
const MAX_ZOOM = 0.25;

const SCALE_FULL_ZOOM = 3;

const Camera = () => {
  const router = useRouter();

  const camera = useRef<CameraView>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);

  const zoom = useSharedValue(0);
  const startZoom = useSharedValue(0);
  const isPressingButton = useSharedValue(false);
  const mode = useSharedValue<CameraMode>("picture");

  const [flash, setFlash] = useState<FlashMode>("off");
  const [facing, setCameraPosition] = useState<CameraType>("back");

  const onInitialized = useCallback(() => {
    setIsCameraInitialized(true);
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === "back" ? "front" : "back"));
  }, []);

  const setMode = useCallback(
    (newMode: CameraMode) => {
      mode.value = newMode;
    },
    [mode],
  );

  const setIsPressingButton = useCallback(
    (newIsPressingButton: boolean) => {
      isPressingButton.value = newIsPressingButton;
    },
    [isPressingButton],
  );

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, MAX_ZOOM), MIN_ZOOM);
    return {
      zoom: z,
    };
  }, [MAX_ZOOM, MIN_ZOOM, zoom]);

  const onMediaCaptured = useCallback(
    (uri: string, type: CameraMode) => {
      // // TODO: HANDLE ROUTING
      console.log(`${type} captured! ${JSON.stringify(uri)}`);
      router.push({
        pathname: "/preview",
        params: {
          uri,
          type,
        },
      });
    },
    [router],
  );

  const doubleTapGesture = React.useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDistance(20)
        .onEnd(() => {
          runOnJS(onFlipCameraPressed)();
        }),
    [onFlipCameraPressed],
  );

  const pinchGesture = React.useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          startZoom.value = zoom.value;
        })
        .onUpdate((event) => {
          "worklet";
          const scale = interpolate(
            event.scale,
            [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM],
            [-1, 0, 1],
            Extrapolation.CLAMP,
          );
          zoom.value = interpolate(
            scale,
            [-1, 0, 1],
            [MIN_ZOOM, startZoom.value, MAX_ZOOM],
            Extrapolation.CLAMP,
          );
        }),
    [startZoom, zoom],
  );

  return (
    <View style={styles.container}>
      <GestureDetector
        gesture={Gesture.Simultaneous(pinchGesture, doubleTapGesture)}
      >
        <Reanimated.View style={StyleSheet.absoluteFill}>
          <Reanimated.View style={styles.cameraContainer}>
            <ReanimatedCamera
              ref={camera}
              mode={mode}
              flash={flash}
              facing={facing}
              pointerEvents={"none"}
              onCameraReady={onInitialized}
              animatedProps={cameraAnimatedProps}
              style={styles.camera}
            />
          </Reanimated.View>
        </Reanimated.View>
      </GestureDetector>

      <CaptureButton
        style={styles.captureButton}
        camera={camera}
        onMediaCaptured={onMediaCaptured}
        cameraZoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        enabled={isCameraInitialized}
        setMode={setMode}
        setIsPressingButton={setIsPressingButton}
      />

      <StatusBarBlurBackground />

      <View style={styles.leftButtonRow}>
        <TouchableOpacity
          onPress={() => router.navigate("/self-profile/media-of-you/")}
        >
          <X />
        </TouchableOpacity>
      </View>

      <View style={styles.rightButtonRow}>
        <TouchableOpacity style={styles.button} onPress={onFlipCameraPressed}>
          <Ionicons name="camera-reverse" color="white" size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onFlashPressed}>
          <Ionicons
            name={flash === "on" ? "flash" : "flash-off"}
            color="white"
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => console.log("Devices")}
        >
          <Ionicons name="settings-outline" color="white" size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => console.log("CodeScannerPage")}
        >
          <Ionicons name="qr-code-outline" color="white" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Camera;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraContainer: {
    flex: 1,
    // marginBottom: 20,
    // borderBottomLeftRadius: 30,
    // borderBottomRightRadius: 30,
    // overflow: "hidden", // Ensures the camera content is clipped to the rounded border
  },
  camera: {
    flex: 1,
    borderRadius: 20, // Match the border radius to the container
  },
  captureButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: SAFE_AREA_PADDING.paddingBottom,
  },
  button: {
    marginBottom: CONTENT_SPACING,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    backgroundColor: "rgba(140, 140, 140, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  leftButtonRow: {
    position: "absolute",
    top: SAFE_AREA_PADDING.paddingTop + 12,
    left: SAFE_AREA_PADDING.paddingLeft + 12,
  },
  rightButtonRow: {
    position: "absolute",
    top: SAFE_AREA_PADDING.paddingTop + 12,
    right: SAFE_AREA_PADDING.paddingRight + 12,
  },
  text: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
});
