import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/core";
import { CameraOff } from "@tamagui/lucide-icons";
import { Text, View } from "tamagui";

import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
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

const MAX_ZOOM_FACTOR = 10;

const SCREEN_WIDTH = Dimensions.get("screen").width;
const SCREEN_HEIGHT = Dimensions.get("screen").height;

const SCALE_FULL_ZOOM = 3;

const CameraPage = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const SAFE_AREA_PADDING = {
    paddingLeft: insets.left,
    paddingTop: insets.top,
    paddingRight: insets.right,
    paddingBottom: insets.bottom,
  };

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

  const [targetFps, _setTargetFps] = useState(60);

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

  const _fps = Math.min(format?.maxFps ?? 1, targetFps);

  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  const videoHdr = format?.supportsVideoHdr && enableHdr;
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr;

  const supportsHdr = format?.supportsPhotoHdr;
  const supportsFlash = device?.hasFlash ?? false;
  const supportsFocus = device?.supportsFocus ?? false;
  const supportsNightMode = device?.supportsLowLightBoost ?? false;
  const _supports60Fps = useMemo(
    () => device?.formats.some((format) => format.maxFps >= 60),
    [device?.formats],
  );

  const onInitialized = useCallback(() => {
    setIsCameraInitialized(true);
  }, []);

  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: "photo" | "video") => {
      const { path: uri, width: dimension1, height: dimension2 } = media;

      const [width, height] =
        dimension1 < dimension2
          ? [dimension1, dimension2]
          : [dimension2, dimension1];

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
      videoMaxDuration: 60,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });

    if (!result.canceled) {
      const imagePickerAsset = result.assets[0];
      if (imagePickerAsset === undefined) return;

      const { uri, width, height, type } = imagePickerAsset;

      router.navigate({
        pathname: "/preview",
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
    <View flex={1}>
      <View
        width={SCREEN_WIDTH}
        height={(SCREEN_WIDTH * 16) / 9}
        borderRadius={20}
        overflow="hidden"
        alignSelf="center"
        position="absolute"
        top={SAFE_AREA_PADDING.paddingTop}
      >
        <GestureDetector gesture={composedGesture}>
          {/* Do not delete this View, its needed to pass touch events to the camera */}
          <View flex={1}>
            <ReanimatedCamera
              ref={camera}
              device={device}
              isActive={isActive}
              onInitialized={onInitialized}
              format={format}
              fps={30}
              photoHdr={photoHdr}
              videoHdr={videoHdr}
              // outputOrientation="portrait"
              photoQualityBalance="quality"
              lowLightBoost={device.supportsLowLightBoost && enableNightMode}
              enableZoomGesture={false}
              animatedProps={cameraAnimatedProps}
              photo={true}
              video={true}
              audio={microphone.hasPermission}
              enableLocation={location.hasPermission}
              style={{
                flex: 1,
              }}
            />
          </View>
        </GestureDetector>

        {animations.map(({ id, point }) => (
          <FocusIcon key={id} x={point.x} y={point.y} />
        ))}

        <CaptureButton
          style={{
            position: "absolute",
            alignSelf: "center",
            bottom: 36,
          }}
          camera={camera}
          onMediaCaptured={onMediaCaptured}
          cameraZoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          flash={supportsFlash ? flash : "off"}
          enabled={isCameraInitialized && isActive}
          setIsPressingButton={setIsPressingButton}
        />

        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              position: "absolute",
              bottom: 12,
              left: 12,
            },
          ]}
          onPress={onOpenMediaPicker}
        >
          <BlurView intensity={50} style={styles.blurView}>
            <Ionicons name="images" color="white" size={24} />
          </BlurView>
        </TouchableOpacity>

        <View
          position="absolute"
          top={12}
          right={12}
          flexDirection="column"
          gap={"$2"}
        >
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onFlipCameraPressed}
          >
            <BlurView intensity={50} style={styles.blurView}>
              <Ionicons name="camera-reverse" color="white" size={24} />
            </BlurView>
          </TouchableOpacity>
          {supportsFlash && (
            <TouchableOpacity
              style={[styles.iconButton]}
              onPress={onFlashPressed}
            >
              <BlurView intensity={50} style={styles.blurView}>
                <Ionicons
                  name={flash === "on" ? "flash" : "flash-off"}
                  color="white"
                  size={24}
                />
              </BlurView>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const NoCameraDeviceError = () => {
  return (
    <BaseScreenView justifyContent="center" alignItems="center">
      <EmptyPlaceholder
        title="No camera device found"
        subtitle="Please check your camera settings and try again."
        icon={<CameraOff />}
      />
    </BaseScreenView>
  );
};

export default CameraPage;

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  blurView: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(64, 64, 64, 0.4)",
  },
});
