import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import type {
  CameraProps,
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
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/core";
import { SizableText, Text, View } from "tamagui";

import { StatusBarBlurBackground } from "~/components/StatusBars";
import { BaseScreenView } from "~/components/Views";
import {
  CONTENT_SPACING,
  CONTROL_BUTTON_SIZE,
  MAX_ZOOM_FACTOR,
  SAFE_AREA_PADDING,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "~/constants/camera";
import {
  CaptureButton,
  FocusIcon,
  useFocusAnimations,
} from "~/features/camera/components";
import useIsForeground from "~/hooks/useIsForeground";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const SCALE_FULL_ZOOM = 3;

const CameraPage = () => {
  const router = useRouter();

  const camera = useRef<Camera>(null);

  const location = useLocationPermission();
  const microphone = useMicrophonePermission();

  const [isCameraInitialized, setIsCameraInitialized] = useState(false);

  const { animations, addAnimation } = useFocusAnimations();

  const zoom = useSharedValue(1);
  const startZoom = useSharedValue(zoom.value);

  const isPressingButton = useSharedValue(false);

  const setIsPressingButton = useCallback(
    (newIsPressingButton: boolean) => {
      isPressingButton.value = newIsPressingButton;
    },
    [isPressingButton],
  );

  // check if camera page is active
  const isFocussed = useIsFocused();
  const isForeground = useIsForeground();
  const isActive = isFocussed && isForeground;

  const [targetFps, setTargetFps] = useState(60);

  const [enableHdr, setEnableHdr] = useState(false);
  const [enableNightMode, setEnableNightMode] = useState(false);

  const [flash, setFlash] = useState<"off" | "on">("off");
  const [position, setPosition] = useState<"front" | "back">("back");

  const device = useCameraDevice(position);

  const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: screenAspectRatio },
    { videoResolution: "max" },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: "max" },
  ]);

  const fps = Math.min(format?.maxFps ?? 1, targetFps);

  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  const videoHdr = format?.supportsVideoHdr && enableHdr;
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr;

  const supportsHdr = format?.supportsPhotoHdr;
  const supportsFlash = device?.hasFlash ?? false;
  const supportsFocus = device?.supportsFocus ?? false;
  const supportsNightMode = device?.supportsLowLightBoost ?? false;
  const supports60Fps = useMemo(
    () => device?.formats.some((format) => format.maxFps >= 60),
    [device?.formats],
  );

  const onInitialized = useCallback(() => {
    setIsCameraInitialized(true);
  }, []);

  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: "photo" | "video") => {
      const { path: uri, width, height } = media;

      router.push({
        pathname: "/preview",
        params: {
          type,
          uri,
          width,
          height,
        },
      });
    },
    [router],
  );

  const onOpenMediaPicker = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      aspect: [16, 9],
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });

    if (!result.canceled) {
      const imagePickerAsset = result.assets[0];
      if (imagePickerAsset === undefined) return;

      const { uri, width, height, type } = imagePickerAsset;

      router.navigate({
        pathname: "/post-to",
        params: {
          type: type === "video" ? "video" : "photo",
          uri,
          width,
          height,
        },
      });
    }
  }, [router]);

  const onFlipCameraPressed = useCallback(() => {
    setPosition((p) => (p === "back" ? "front" : "back"));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  const onFocus = useCallback(
    (point: Point) => {
      addAnimation(point);
      void camera.current?.focus(point);
    },
    [addAnimation],
  );

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

  const flipCameraGesture = React.useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onEnd(() => {
          runOnJS(onFlipCameraPressed)();
        }),
    [onFlipCameraPressed],
  );

  const focusGesture = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(1)
    .enabled(supportsFocus)
    .onEnd(({ x, y }) => {
      runOnJS(onFocus)({ x, y });
    });

  const composedGesture = Gesture.Exclusive(
    flipCameraGesture,
    Gesture.Race(supportsFocus ? focusGesture : Gesture.Tap(), zoomGesture),
  );

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom);
    return {
      zoom: z,
    };
  }, [maxZoom, minZoom, zoom]);

  useEffect(() => {
    // Reset zoom to it's default everytime the `device` changes.
    zoom.value = device?.neutralZoom ?? 1;
  }, [zoom, device]);

  if (device === undefined) return <NoCameraDeviceError />;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
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

      {animations.map(({ id, point }) => (
        <FocusIcon key={id} x={point.x} y={point.y} />
      ))}

      <TouchableOpacity
        style={styles.mediaPickerButton}
        onPress={onOpenMediaPicker}
      >
        <Ionicons name="images" color="white" size={32} />
      </TouchableOpacity>

      <View style={styles.leftButtonRow}>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Ionicons name="close" color="white" size={24} />
        </TouchableOpacity>
      </View>

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
            <SizableText size="$1" textAlign="center">
              {`${targetFps}\nFPS`}
            </SizableText>
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
        {supportsNightMode && (
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
          onPress={() => router.navigate("/scanner")}
        >
          <Ionicons name="qr-code-outline" color="white" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const NoCameraDeviceError = () => {
  return (
    <BaseScreenView justifyContent="center" alignItems="center">
      <Text>No camera device found</Text>
    </BaseScreenView>
  );
};

export default CameraPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mediaPickerButton: {
    position: "absolute",
    bottom: SAFE_AREA_PADDING.paddingBottom + 12,
    left: SAFE_AREA_PADDING.paddingLeft + 36,
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
});
