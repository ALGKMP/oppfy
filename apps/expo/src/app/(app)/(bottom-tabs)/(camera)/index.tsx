import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { PinchGestureHandlerGestureEvent } from "react-native-gesture-handler";
import {
  PinchGestureHandler,
  TapGestureHandler,
} from "react-native-gesture-handler";
import Reanimated, {
  Extrapolate,
  interpolate,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import type { CameraProps, CameraType, FlashMode } from "expo-camera/next";
import { CameraView } from "expo-camera/next";
import { Ionicons } from "@expo/vector-icons";

import { CaptureButton, StatusBarBlurBackground } from "~/components/camera";
import {
  CONTENT_SPACING,
  CONTROL_BUTTON_SIZE,
  MAX_ZOOM_FACTOR,
  SAFE_AREA_PADDING,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "~/constants/camera";

const ReanimatedCamera = Reanimated.createAnimatedComponent(CameraView);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const SCALE_FULL_ZOOM = 3;

const Camera = () => {
  const camera = useRef<CameraView>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const zoom = useSharedValue(0);
  const isPressingButton = useSharedValue(false);

  const [flash, setFlash] = useState<FlashMode>("off");
  const [facing, setCameraPosition] = useState<CameraType>("back");

  const minZoom = 0;
  const maxZoom = 1;

  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === "back" ? "front" : "back"));
  }, []);
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  const onInitialized = useCallback(() => {
    console.log("Camera initialized!");
    setIsCameraInitialized(true);
  }, []);

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom);
    return {
      zoom: z,
    };
  }, [maxZoom, minZoom, zoom]);

  const setIsPressingButton = useCallback(
    (_isPressingButton: boolean) => {
      isPressingButton.value = _isPressingButton;
    },
    [isPressingButton],
  );

  const onMediaCaptured = useCallback(
    (url: string, type: "picture" | "video") => {
      console.log(`Media captured! ${JSON.stringify(url)}`);
      // TODO: HANDLE ROUTING
      console.log("Media captured!", url, type);
    },
    [],
  );

  const onDoubleTap = useCallback(() => {
    console.log("Double tap");
  }, []);

  // The gesture handler maps the linear pinch gesture (0 - 1) to an exponential curve since a camera's zoom
  // function does not appear linear to the user. (aka zoom 0.1 -> 0.2 does not look equal in difference as 0.8 -> 0.9)
  const onPinchGesture = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startZoom?: number }
  >({
    onStart: (_, context) => {
      context.startZoom = zoom.value;
    },
    onActive: (event, context) => {
      // we're trying to map the scale gesture to a linear zoom here
      const startZoom = context.startZoom ?? 0;
      console.log("startZoom", startZoom);
      const scale = interpolate(
        event.scale,
        [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM],
        [-1, 0, 1],
        Extrapolate.CLAMP,
      );
      zoom.value = interpolate(
        scale,
        [-1, 0, 1],
        [minZoom, startZoom, maxZoom],
        Extrapolate.CLAMP,
      );
    },
  });

  return (
    <View style={styles.container}>
      <PinchGestureHandler
        onGestureEvent={onPinchGesture}
        enabled={isCameraInitialized}
      >
        <Reanimated.View
          // onTouchEnd={onFocusTap}
          style={StyleSheet.absoluteFill}
        >
          <TapGestureHandler onEnded={onDoubleTap} numberOfTaps={2}>
            <ReanimatedCamera
              style={StyleSheet.absoluteFill}
              ref={camera}
              animatedProps={cameraAnimatedProps}
              mode={"picture"}
              onCameraReady={onInitialized}
              flash={flash}
              facing={facing}
            />
          </TapGestureHandler>
        </Reanimated.View>
      </PinchGestureHandler>

      <CaptureButton
        style={styles.captureButton}
        camera={camera}
        onMediaCaptured={onMediaCaptured}
        cameraZoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        enabled={isCameraInitialized}
        setIsPressingButton={setIsPressingButton}
      />

      <StatusBarBlurBackground />

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
          // onPress={() => navigation.navigate("Devices")}
          onPress={() => console.log("Devices")}
        >
          <Ionicons name="settings-outline" color="white" size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          // onPress={() => navigation.navigate("CodeScannerPage")}
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
  rightButtonRow: {
    position: "absolute",
    right: SAFE_AREA_PADDING.paddingRight + 12,
    top: SAFE_AREA_PADDING.paddingTop,
  },
  text: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
});
