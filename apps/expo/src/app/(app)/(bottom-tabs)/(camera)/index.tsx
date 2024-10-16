import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  CameraProps,
  PhotoFile,
  Point,
  VideoFile,
} from 'react-native-vision-camera';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useLocationPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/core';
import { CameraOff } from '@tamagui/lucide-icons';
import { View } from 'tamagui';

import { EmptyPlaceholder } from '~/components/UIPlaceholders';
import { BaseScreenView } from '~/components/Views';
import {
  CaptureButton,
  FocusIcon,
  useFocusAnimations,
} from '~/features/camera/components';
import useIsForeground from '~/hooks/useIsForeground';
import * as MediaLibrary from 'expo-media-library';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const MAX_ZOOM_FACTOR = 10;
const SCALE_FULL_ZOOM = 3;

const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const ASPECT_RATIO = 16 / 9;

const CameraPage = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const safeAreaPadding = {
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

  // Check if camera page is active
  const isFocussed = useIsFocused();
  const isForeground = useIsForeground();
  const isActive = isFocussed && isForeground;

  const [targetFps, _setTargetFps] = useState(30);

  const [enableHdr, _setEnableHdr] = useState(false);
  const [enableNightMode, _setEnableNightMode] = useState(false);

  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [position, setPosition] = useState<'front' | 'back'>('back');

  const device = useCameraDevice(position);

  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: ASPECT_RATIO },
    { videoResolution: 'max' },
    { photoAspectRatio: ASPECT_RATIO },
    { photoResolution: 'max' },
  ]);

  const _fps = Math.min(format?.maxFps ?? 1, targetFps);

  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  const videoHdr = format?.supportsVideoHdr && enableHdr;
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr;

  const _supportsHdr = format?.supportsPhotoHdr;
  const supportsFlash = device?.hasFlash ?? false;
  const supportsFocus = device?.supportsFocus ?? false;
  const _supportsNightMode = device?.supportsLowLightBoost ?? false;
  const _supports60Fps = useMemo(
    () => device?.formats.some((format) => format.maxFps >= 60),
    [device?.formats],
  );

  const onInitialized = useCallback(() => {
    setIsCameraInitialized(true);
  }, []);

  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
      const { path: uri } = media;

      const dimension1 =
        type === 'video' ? format?.videoWidth : format?.photoWidth;
      const dimension2 =
        type === 'video' ? format?.videoHeight : format?.photoHeight;

      if (dimension1 === undefined || dimension2 === undefined) {
        throw new Error('Dimension is undefined');
      }

      const width = Math.min(dimension1, dimension2);
      const height = Math.max(dimension1, dimension2);

      router.push({
        pathname: '/preview',
        params: {
          type,
          uri,
          width,
          height,
        },
      });
    },
    [
      format?.photoHeight,
      format?.photoWidth,
      format?.videoHeight,
      format?.videoWidth,
      router,
    ],
  );

  const onOpenMediaPicker = useCallback(async () => {
    // Request permissions when the button is pressed
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need media library permissions to make this work!');
      return;
    }

    // Navigate to the custom media picker screen
    router.push('/album-picker');
  }, [router]);

  const onFlipCameraPressed = useCallback(() => {
    setPosition((p) => (p === 'back' ? 'front' : 'back'));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === 'off' ? 'on' : 'off'));
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
    // Reset zoom to its default every time the `device` changes.
    zoom.value = device?.neutralZoom ?? 1;
  }, [zoom, device]);

  useEffect(() => {
    const requestMicrophonePermission = async () => {
      if (microphone.hasPermission) return;
      await microphone.requestPermission().catch();
    };

    void requestMicrophonePermission();
  }, [microphone]);

  if (device === undefined) return <NoCameraDeviceError />;

  return (
    <View
      flex={1}
      width={SCREEN_WIDTH}
      height={Math.min(
        (SCREEN_WIDTH * 16) / 9,
        SCREEN_HEIGHT - insets.top - insets.bottom - 70,
      )}
      borderRadius={20}
      overflow="hidden"
      alignSelf="center"
      position="absolute"
      top={safeAreaPadding.paddingTop}
    >
      <GestureDetector gesture={composedGesture}>
        {/* Do not delete this View; it's needed to pass touch events to the camera */}
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
            photoQualityPriority="quality"
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
          position: 'absolute',
          alignSelf: 'center',
          bottom: 36,
        }}
        camera={camera}
        onMediaCaptured={onMediaCaptured}
        cameraZoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        flash={supportsFlash ? flash : 'off'}
        enabled={isCameraInitialized && isActive}
        setIsPressingButton={setIsPressingButton}
      />

      <TouchableOpacity
        style={[
          styles.iconButton,
          {
            position: 'absolute',
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
        gap="$2"
      >
        <TouchableOpacity style={styles.iconButton} onPress={onFlipCameraPressed}>
          <BlurView intensity={50} style={styles.blurView}>
            <Ionicons name="camera-reverse" color="white" size={24} />
          </BlurView>
        </TouchableOpacity>
        {supportsFlash && (
          <TouchableOpacity style={styles.iconButton} onPress={onFlashPressed}>
            <BlurView intensity={50} style={styles.blurView}>
              <Ionicons
                name={flash === 'on' ? 'flash' : 'flash-off'}
                color="white"
                size={24}
              />
            </BlurView>
          </TouchableOpacity>
        )}
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
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(64, 64, 64, 0.4)',
  },
});