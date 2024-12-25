import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Linking,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
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
import { BlurView } from "expo-blur";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/core";
import { CameraOff } from "@tamagui/lucide-icons";

import CaptureButton from "~/components/CaptureButton";
import Focus, { useFocusAnimations } from "~/components/Icons/Focus";
import { ScreenView, useAlertDialogController, View } from "~/components/ui";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import useIsForeground from "~/hooks/useIsForeground";

const MAX_RECORDING_DURATION = 60 * 1000; // 1 minute

const ASPECT_RATIO = 16 / 9;
const SCREEN_WIDTH = Dimensions.get("window").width;
const PREVIEW_HEIGHT = SCREEN_WIDTH * ASPECT_RATIO; // 16:9

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({ zoom: true });

const MAX_ZOOM_FACTOR = 10;
const SCALE_FULL_ZOOM = 3;

const CameraPage = () => {
  const router = useRouter();
  const alertDialog = useAlertDialogController();

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

  const isFocussed = useIsFocused();
  const isForeground = useIsForeground();
  const isActive = isFocussed && isForeground;

  const [targetFps] = useState(30);
  const [enableHdr] = useState(false);
  const [enableNightMode] = useState(false);

  const [flash, setFlash] = useState<"off" | "on">("off");
  const [position, setPosition] = useState<"front" | "back">("back");

  const device = useCameraDevice(position);
  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: ASPECT_RATIO },
    { photoAspectRatio: ASPECT_RATIO },
  ]);

  const maxFps = Math.min(format?.maxFps ?? 30, targetFps);
  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  const videoHdr = format?.supportsVideoHdr && enableHdr;
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr;
  const supportsFlash = device?.hasFlash ?? false;
  const supportsFocus = device?.supportsFocus ?? false;

  const onInitialized = useCallback(() => {
    setIsCameraInitialized(true);
  }, []);

  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: "photo" | "video") => {
      const { path: uri } = media;

      const w = format?.photoWidth ?? format?.videoWidth;
      const h = format?.photoHeight ?? format?.videoHeight;

      if (!w || !h) {
        throw new Error("Captured media dimensions not found");
      }

      router.push({
        pathname: "/preview",
        params: {
          type,
          uri,
          width: w,
          height: h,
        },
      });
    },
    [format, router],
  );

  const onOpenMediaPicker = useCallback(async () => {
    const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
    if (status === "granted") {
      router.push("/(app)/(bottom-tabs)/(camera)/(media-picker)/album-picker");
      return;
    }
    if (canAskAgain) {
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (granted) {
        router.push(
          "/(app)/(bottom-tabs)/(camera)/(media-picker)/album-picker",
        );
        return;
      }
    }

    const confirmed = await alertDialog.show({
      title: "Media Library Permission",
      subtitle: "Please grant permission to access your media.",
      cancelText: "OK",
      acceptText: "Settings",
    });
    if (confirmed) {
      await Linking.openSettings();
    }
  }, [alertDialog, router]);

  const onFlipCameraPressed = useCallback(() => {
    setPosition((p) => (p === "back" ? "front" : "back"));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  const onFocus = useCallback(
    (point: Point) => {
      addAnimation(point);
      camera.current?.focus(point);
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

  const flipCameraGesture = useMemo(
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
    zoom.value = device?.neutralZoom ?? 1;
  }, [zoom, device]);

  useEffect(() => {
    if (!microphone.hasPermission) {
      microphone.requestPermission().catch(() => {});
    }
  }, [microphone]);

  if (!device) {
    return (
      <ScreenView
        alignItems="center"
        justifyContent="center"
        safeAreaEdges={["top"]}
      >
        <EmptyPlaceholder
          title="No camera device found"
          subtitle="Please check your camera settings and try again."
          icon={<CameraOff />}
        />
      </ScreenView>
    );
  }

  return (
    <ScreenView padding={0} safeAreaEdges={["top"]}>
      <View
        width={SCREEN_WIDTH}
        height={PREVIEW_HEIGHT}
        borderRadius={20}
        overflow="hidden"
      >
        <GestureDetector gesture={composedGesture}>
          <View style={{ flex: 1 }}>
            <ReanimatedCamera
              ref={camera}
              device={device}
              isActive={isActive}
              onInitialized={onInitialized}
              format={format}
              fps={maxFps}
              photoHdr={photoHdr}
              videoHdr={videoHdr}
              lowLightBoost={device.supportsLowLightBoost && enableNightMode}
              enableZoomGesture={false}
              animatedProps={cameraAnimatedProps}
              photo={true}
              video={true}
              audio={microphone.hasPermission}
              enableLocation={location.hasPermission}
              style={{ flex: 1 }}
            />
          </View>
        </GestureDetector>

        {animations.map(({ id, point }) => (
          <Focus key={id} x={point.x} y={point.y} />
        ))}

        <CaptureButton
          camera={camera}
          cameraZoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          flash={supportsFlash ? flash : "off"}
          enabled={isCameraInitialized && isActive}
          maxRecordingDuration={MAX_RECORDING_DURATION}
          setIsPressingButton={setIsPressingButton}
          onMediaCaptured={onMediaCaptured}
          style={{ position: "absolute", alignSelf: "center", bottom: 36 }}
        />

        <TouchableOpacity
          style={[
            styles.iconButton,
            { position: "absolute", bottom: 12, left: 12 },
          ]}
          onPress={onOpenMediaPicker}
        >
          <BlurView intensity={50} style={styles.blurView}>
            <Ionicons name="images" color="white" size={24} />
          </BlurView>
        </TouchableOpacity>

        <View style={{ position: "absolute", top: 12, right: 12 }}>
          <TouchableOpacity
            style={[styles.iconButton, { marginBottom: 8 }]}
            onPress={onFlipCameraPressed}
          >
            <BlurView intensity={50} style={styles.blurView}>
              <Ionicons name="camera-reverse" color="white" size={24} />
            </BlurView>
          </TouchableOpacity>
          {supportsFlash && (
            <TouchableOpacity
              style={styles.iconButton}
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
    </ScreenView>
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
