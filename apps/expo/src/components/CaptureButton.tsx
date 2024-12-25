import type { RefObject } from "react";
import React, { useCallback, useRef } from "react";
import type { ViewProps } from "react-native";
import { Dimensions, StyleSheet, View } from "react-native";
import type {
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Reanimated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { Camera, PhotoFile, VideoFile } from "react-native-vision-camera";

type FailOffset = [failOffsetXStart: number, failOffsetXEnd: number];

const CAPTURE_BUTTON_SIZE = 100;

const SCREEN_WIDTH = Dimensions.get("screen").width;
const SCREEN_HEIGHT = Dimensions.get("screen").height;

const PAN_GESTURE_HANDLER_FAIL_X = [
  -SCREEN_WIDTH,
  SCREEN_WIDTH,
] satisfies FailOffset;
const PAN_GESTURE_HANDLER_ACTIVE_Y = [-2, 2] satisfies FailOffset;

const START_RECORDING_DELAY = 200;
const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.075;

interface Context {
  offsetY?: number;
  startY?: number;
}

interface Props extends ViewProps {
  camera: RefObject<Camera>;
  onMediaCaptured: (
    media: PhotoFile | VideoFile,
    type: "photo" | "video",
  ) => void;

  minZoom: number;
  maxZoom: number;
  cameraZoom: SharedValue<number>;

  flash: "off" | "on";

  enabled: boolean;

  setIsPressingButton: (isPressingButton: boolean) => void;

  maxRecordingDuration: number;
}

const CaptureButton = ({
  camera,
  onMediaCaptured,
  minZoom,
  maxZoom,
  flash,
  cameraZoom,
  enabled,
  setIsPressingButton,
  maxRecordingDuration,
  style,
  ...props
}: Props) => {
  const isRecording = useRef(false);
  const pressDownDate = useRef<Date | undefined>(undefined);

  const context = useSharedValue<Context>({});
  const recordingProgress = useSharedValue(0);
  const isPressingButton = useSharedValue(false);

  const takePhoto = useCallback(async () => {
    if (camera.current === null) throw new Error("Camera ref is null");

    const photo = await camera.current.takePhoto({
      flash,
    });
    onMediaCaptured(photo, "photo");
  }, [camera, flash, onMediaCaptured]);

  const onStoppedRecording = useCallback(() => {
    isRecording.current = false;
    cancelAnimation(recordingProgress);
  }, [recordingProgress]);

  const stopRecording = useCallback(async () => {
    if (camera.current === null) throw new Error("Camera ref is null");
    await camera.current.stopRecording();
  }, [camera]);

  const startRecording = useCallback(() => {
    if (camera.current === null) throw new Error("Camera ref is null");

    recordingProgress.value = withTiming(1, {
      duration: maxRecordingDuration,
      easing: Easing.linear,
    });

    camera.current.startRecording({
      flash,
      onRecordingError: () => {
        onStoppedRecording();
      },
      onRecordingFinished: (video) => {
        onMediaCaptured(video, "video");
        onStoppedRecording();
      },
    });
    isRecording.current = true;

    setTimeout(() => {
      if (isRecording.current) {
        void stopRecording();
        isPressingButton.value = false;
        setIsPressingButton(false);
      }
    }, MAX_RECORDING_DURATION);
  }, [
    camera,
    flash,
    onMediaCaptured,
    onStoppedRecording,
    recordingProgress,
    isPressingButton,
    setIsPressingButton,
  ]);

  const handleTapOnEnd = useCallback(
    async (_event: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => {
      if (pressDownDate.current === undefined) {
        throw new Error("PressDownDate ref.current was null");
      }

      const now = new Date();
      const diff = now.getTime() - pressDownDate.current.getTime();
      pressDownDate.current = undefined;

      diff < START_RECORDING_DELAY ? await takePhoto() : await stopRecording();

      isPressingButton.value = false;
      setIsPressingButton(false);
    },
    [isPressingButton, setIsPressingButton, stopRecording, takePhoto],
  );

  const handleTapOnStart = useCallback(
    (_event: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => {
      recordingProgress.value = 0;
      isPressingButton.value = true;

      const now = new Date();
      pressDownDate.current = now;

      setTimeout(() => {
        if (pressDownDate.current === now) {
          console.log("calling start recording");
          void startRecording();
        }
      }, START_RECORDING_DELAY);
      setIsPressingButton(true);
    },
    [isPressingButton, recordingProgress, setIsPressingButton, startRecording],
  );

  const tapGesture = Gesture.Tap()
    .shouldCancelWhenOutside(false)
    .maxDuration(Number.MAX_SAFE_INTEGER) // <-- this prevents the TapGestureHandler from going to State.FAILED when the user moves his finger outside of the child view (to zoom)
    .onBegin((event) => {
      runOnJS(handleTapOnStart)(event);
    })
    .onEnd((event) => {
      runOnJS(handleTapOnEnd)(event);
    });

  const handlePanOnStart = useCallback(
    (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
      "worklet";
      context.value.startY = event.absoluteY;

      const yForFullZoom = context.value.startY ?? 0 * 0.7;
      const offsetYForFullZoom = context.value.startY ?? 0 - yForFullZoom;

      // extrapolate [0 ... 1] zoom -> [0 ... Y_FOR_FULL_ZOOM] finger position
      context.value.offsetY = interpolate(
        cameraZoom.value,
        [minZoom, maxZoom],
        [0, offsetYForFullZoom],
        Extrapolation.CLAMP,
      );
    },
    [cameraZoom.value, context.value, maxZoom, minZoom],
  );

  const handlePanOnUpdate = useCallback(
    (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      "worklet";
      const offset = context.value.offsetY ?? 0;
      const startY = context.value.startY ?? SCREEN_HEIGHT;
      const yForFullZoom = startY * 0.7;

      cameraZoom.value = interpolate(
        event.absoluteY - offset,
        [yForFullZoom, startY],
        [maxZoom, minZoom],
        Extrapolation.CLAMP,
      );
    },
    [cameraZoom, context.value.offsetY, context.value.startY, maxZoom, minZoom],
  );

  const panGesture = Gesture.Pan()
    .failOffsetX(PAN_GESTURE_HANDLER_FAIL_X)
    .activeOffsetY(PAN_GESTURE_HANDLER_ACTIVE_Y)
    .onStart((event) => {
      handlePanOnStart(event);
    })
    .onUpdate((event) => {
      handlePanOnUpdate(event);
    });

  const shadowStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          scale: withSpring(isPressingButton.value ? 1 : 0, {
            mass: 1,
            damping: 35,
            stiffness: 300,
          }),
        },
      ],
    }),
    [isPressingButton],
  );

  const buttonStyle = useAnimatedStyle(() => {
    let scale: number;
    if (enabled) {
      if (isPressingButton.value) {
        scale = withRepeat(
          withSpring(1, {
            stiffness: 100,
            damping: 1000,
          }),
          -1,
          true,
        );
      } else {
        scale = withSpring(0.9, {
          stiffness: 500,
          damping: 300,
        });
      }
    } else {
      scale = withSpring(0.6, {
        stiffness: 500,
        damping: 300,
      });
    }

    return {
      opacity: withTiming(enabled ? 1 : 0.3, {
        duration: 100,
        easing: Easing.linear,
      }),
      transform: [
        {
          scale: scale,
        },
      ],
    };
  }, [enabled, isPressingButton]);

  return (
    <GestureDetector gesture={Gesture.Simultaneous(tapGesture, panGesture)}>
      <Reanimated.View {...props} style={[buttonStyle, style]}>
        <Reanimated.View style={[styles.shadow, shadowStyle]} />
        <View style={styles.button} />
      </Reanimated.View>
    </GestureDetector>
  );
};

export default React.memo(CaptureButton);

const styles = StyleSheet.create({
  shadow: {
    position: "absolute",
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    backgroundColor: "#F214FF",
  },
  button: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: "white",
  },
});
