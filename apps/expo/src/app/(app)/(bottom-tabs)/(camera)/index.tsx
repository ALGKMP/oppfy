import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import type { GestureResponderEvent } from "react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { PinchGestureHandlerGestureEvent } from "react-native-gesture-handler";
import {
  Gesture,
  GestureDetector,
  PinchGestureHandler,
  TapGestureHandler,
} from "react-native-gesture-handler";
import Reanimated, {
  Extrapolate,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import type {
  CameraProps,
  CameraRuntimeError,
  PhotoFile,
  Point,
  VideoFile,
} from "react-native-vision-camera";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useLocationPermission,
  useMicrophonePermission,
} from "react-native-vision-camera";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/core";

import { CaptureButton, StatusBarBlurBackground } from "~/components/camera";
import {
  CONTENT_SPACING,
  CONTROL_BUTTON_SIZE,
  MAX_ZOOM_FACTOR,
  SAFE_AREA_PADDING,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "~/constants/camera";
import useIsForeground from "~/hooks/useIsForeground";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const SCALE_FULL_ZOOM = 3;

const CameraPage = () => {
  const router = useRouter();

  const camera = useRef<Camera>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const microphone = useMicrophonePermission();
  const location = useLocationPermission();
  const zoom = useSharedValue(1);
  const isPressingButton = useSharedValue(false);

  // check if camera page is active
  const isFocussed = useIsFocused();
  const isForeground = useIsForeground();
  const isActive = isFocussed && isForeground;

  const [cameraPosition, setCameraPosition] = useState<"front" | "back">(
    "back",
  );
  const [enableHdr, setEnableHdr] = useState(false);
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [enableNightMode, setEnableNightMode] = useState(false);

  const device = useCameraDevice(cameraPosition);

  const [targetFps, setTargetFps] = useState(60);

  const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: screenAspectRatio },
    { videoResolution: "max" },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: "max" },
  ]);

  const fps = Math.min(format?.maxFps ?? 1, targetFps);

  const supportsFlash = device?.hasFlash ?? false;
  const supportsHdr = format?.supportsPhotoHdr;
  const supports60Fps = useMemo(
    () => device?.formats.some((format) => format.maxFps >= 60),
    [device?.formats],
  );
  const canToggleNightMode = device?.supportsLowLightBoost ?? false;

  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom);
    return {
      zoom: z,
    };
  }, [maxZoom, minZoom, zoom]);

  const setIsPressingButton = useCallback(
    (newIsPressingButton: boolean) => {
      isPressingButton.value = newIsPressingButton;
    },
    [isPressingButton],
  );

  const onInitialized = useCallback(() => {
    console.log("Camera initialized!");
    setIsCameraInitialized(true);
  }, []);

  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: "photo" | "video") => {
      router.push({
        pathname: "/preview",
        params: {
          type,
          uri: media.path,
        },
      });
    },
    [router],
  );

  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === "back" ? "front" : "back"));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  const flipCameraGesture = React.useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDistance(20)
        .onEnd(() => {
          runOnJS(onFlipCameraPressed)();
        }),
    [onFlipCameraPressed],
  );

  useEffect(() => {
    // Reset zoom to it's default everytime the `device` changes.
    zoom.value = device?.neutralZoom ?? 1;
  }, [zoom, device]);

  const startZoom = useSharedValue(0);
  const zoomGesture = Gesture.Pinch()
    .onStart(() => {
      startZoom.value = zoom.value;
    })
    .onUpdate((event) => {
      const scale = interpolate(
        event.scale,
        [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM],
        [-1, 0, 1],
        Extrapolation.CLAMP,
      );
      zoom.value = interpolate(
        scale,
        [-1, 0, 1],
        [minZoom, startZoom.value, maxZoom],
        Extrapolation.CLAMP,
      );
    });

  const focus = useCallback((point: Point) => {
    if (camera.current == null) return;
    void camera.current.focus(point);
  }, []);

  const focusGesture = Gesture.Tap().onEnd(({ x, y }) => {
    runOnJS(focus)({ x, y });
  });

  const videoHdr = format?.supportsVideoHdr && enableHdr;
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr;

  if (device === undefined) return <NoCameraDeviceError />;

  return (
    <View style={styles.container}>
      <GestureDetector
        gesture={Gesture.Simultaneous(
          zoomGesture,
          flipCameraGesture,
          focusGesture,
        )}
      >
        <ReanimatedCamera
          ref={camera}
          device={device}
          isActive={isActive}
          onInitialized={onInitialized}
          format={format}
          fps={fps}
          photoHdr={photoHdr}
          videoHdr={videoHdr}
          photoQualityBalance="quality"
          lowLightBoost={device.supportsLowLightBoost && enableNightMode}
          enableZoomGesture={false}
          animatedProps={cameraAnimatedProps}
          orientation="portrait"
          photo={true}
          video={true}
          audio={microphone.hasPermission}
          enableLocation={location.hasPermission}
          style={StyleSheet.absoluteFill}
        />
      </GestureDetector>

      <CaptureButton
        style={styles.captureButton}
        camera={camera}
        onMediaCaptured={onMediaCaptured}
        cameraZoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        flash={supportsFlash ? flash : "off"}
        enabled={isCameraInitialized && isActive}
        setIsPressingButton={setIsPressingButton}
      />

      <StatusBarBlurBackground />

      <View style={styles.rightButtonRow}>
        <TouchableOpacity style={styles.button} onPress={onFlipCameraPressed}>
          <Ionicons name="camera-reverse" color="white" size={24} />
        </TouchableOpacity>
        {supportsFlash && (
          <TouchableOpacity style={styles.button} onPress={onFlashPressed}>
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              color="white"
              size={24}
            />
          </TouchableOpacity>
        )}
        {supports60Fps && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setTargetFps((t) => (t === 30 ? 60 : 30))}
          >
            <Text style={styles.text}>{`${targetFps}\nFPS`}</Text>
          </TouchableOpacity>
        )}
        {supportsHdr && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setEnableHdr((h) => !h)}
          >
            <MaterialIcons
              name={enableHdr ? "hdr-on" : "hdr-off"}
              color="white"
              size={24}
            />
          </TouchableOpacity>
        )}
        {canToggleNightMode && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setEnableNightMode(!enableNightMode)}
          >
            <Ionicons
              name={enableNightMode ? "moon" : "moon-outline"}
              color="white"
              size={24}
            />
          </TouchableOpacity>
        )}
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

const NoCameraDeviceError = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "white" }}>No camera device found</Text>
    </View>
  );
};

export default CameraPage;

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
    right: SAFE_AREA_PADDING.paddingRight,
    top: SAFE_AREA_PADDING.paddingTop,
  },
  text: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
});
