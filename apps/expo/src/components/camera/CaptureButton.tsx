import React, { useCallback, useRef } from "react";
import type { ViewProps } from "react-native";
import { StyleSheet, View } from "react-native";
import type {
  GestureStateChangeEvent,
  GestureTouchEvent,
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
import type { CameraView } from "expo-camera/next";

import {
  CAPTURE_BUTTON_SIZE,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "~/constants/camera";

const PAN_GESTURE_HANDLER_FAIL_X = [-SCREEN_WIDTH, SCREEN_WIDTH];
const PAN_GESTURE_HANDLER_ACTIVE_Y = [-2, 2];

const START_RECORDING_DELAY = 200;
const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1;

interface Props extends ViewProps {
  camera: React.RefObject<CameraView>;
  onMediaCaptured: (url: string, type: "picture" | "video") => void;

  minZoom: number;
  maxZoom: number;
  cameraZoom: SharedValue<number>;

  enabled: boolean;

  setIsPressingButton: (isPressingButton: boolean) => void;
}

const CaptureButton: React.FC<Props> = ({
  camera,
  onMediaCaptured,
  minZoom,
  maxZoom,
  cameraZoom,
  enabled,
  setIsPressingButton,
  style,
  ...props
}): React.ReactElement => {
  const isRecording = useRef(false);
  const pressDownDate = useRef<Date | undefined>(undefined);

  const recordingProgress = useSharedValue(0);
  const isPressingButton = useSharedValue(false);
  const context = useSharedValue<{ offsetY?: number; startY?: number }>({});

  const takePicture = useCallback(async () => {
    try {
      if (camera.current == null) throw new Error("Camera ref is null!");

      console.log("Taking photo...");
      const picture = await camera.current.takePictureAsync();
      if (picture === undefined) throw new Error("Failed to take photo!");

      onMediaCaptured(picture.uri, "picture");
    } catch (e) {
      console.error("Failed to take photo!", e);
    }
  }, [camera, onMediaCaptured]);

  const onStoppedRecording = useCallback(() => {
    isRecording.current = false;
    cancelAnimation(recordingProgress);
    console.log("stopped recording video!");
  }, [recordingProgress]);
  const stopRecording = useCallback(() => {
    try {
      if (camera.current == null) throw new Error("Camera ref is null!");

      console.log("calling stopRecording()...");
      camera.current.stopRecording();
      console.log("called stopRecording()!");
    } catch (e) {
      console.error("failed to stop recording!", e);
    }
  }, [camera]);
  const startRecording = useCallback(async () => {
    try {
      if (camera.current == null) throw new Error("Camera ref is null!");

      console.log("calling startRecording()...");
      const recording = await camera.current.recordAsync();
      if (recording === undefined) {
        console.error("Recording failed!");
        onStoppedRecording();
        throw new Error("Failed to record video!");
      }

      console.log(`Recording successfully finished! ${recording.uri}`);
      onMediaCaptured(recording.uri, "video");
      onStoppedRecording();

      // TODO: wait until startRecording returns to actually find out if the recording has successfully started
      console.log("called startRecording()!");
      isRecording.current = true;
    } catch (e) {
      console.error("failed to start recording!", e, "camera");
    }
  }, [camera, onMediaCaptured, onStoppedRecording]);

  const handleTapOnStart = useCallback(
    (_event: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => {
      recordingProgress.value = 0;
      isPressingButton.value = true;

      const now = new Date();
      pressDownDate.current = now;

      setTimeout(() => {
        const fn = async () => {
          if (pressDownDate.current === now) {
            await startRecording();
          }
        };

        void fn();
      }, START_RECORDING_DELAY);
      setIsPressingButton(true);
    },
    [isPressingButton, recordingProgress, setIsPressingButton, startRecording],
  );

  const handleTapOnEnd = useCallback(
    async (
      _event:
        | GestureStateChangeEvent<TapGestureHandlerEventPayload>
        | GestureTouchEvent,
    ) => {
      if (pressDownDate.current === undefined) {
        throw new Error("PressDownDate ref.current was null!");
      }

      const now = new Date();
      const diff = now.getTime() - pressDownDate.current.getTime();
      pressDownDate.current = undefined;

      diff < START_RECORDING_DELAY ? await takePicture() : stopRecording();

      setTimeout(() => {
        isPressingButton.value = false;
        setIsPressingButton(false);
      }, 500);
    },
    [isPressingButton, setIsPressingButton, stopRecording, takePicture],
  );

  const tapGesture = Gesture.Tap()
    .onBegin((event) => {
      runOnJS(handleTapOnStart)(event);
    })
    .onEnd((event) => {
      runOnJS(handleTapOnEnd)(event);
    });

  const handlePanOnStart = useCallback(
    (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
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
      runOnJS(handlePanOnStart)(event);
    })
    .onUpdate((event) => {
      runOnJS(handlePanOnUpdate)(event);
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
        <Reanimated.View style={styles.flex}>
          <Reanimated.View style={[styles.shadow, shadowStyle]} />
          <View style={styles.button} />
        </Reanimated.View>
      </Reanimated.View>
    </GestureDetector>
  );
};

export default React.memo(CaptureButton);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  shadow: {
    position: "absolute",
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    backgroundColor: "#e34077",
  },
  button: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: "white",
  },
});
