import type { ReactNode } from "react";
import React, { useCallback, useState } from "react";
import { Modal, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Stack, View, XStack, YStack } from "tamagui";

interface Option {
  label: ReactNode;
  icon: ReactNode;
  onPress: () => void;
}

interface BlurContextMenuWrapperProps {
  children: ReactNode;
  options: Option[];
}

export const BlurContextMenuWrapper = (props: BlurContextMenuWrapperProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const scale = useSharedValue(1);
  const animationState = useSharedValue(0);

  const hideContextMenu = useCallback(() => setIsVisible(false), []);

  const longPressGesture = Gesture.LongPress()
    .minDuration(350)
    .onTouchesDown(() => {
      animationState.value = withDelay(
        200,
        withTiming(1, { duration: 0 }, (finished) => {
          if (finished) {
            scale.value = withTiming(1.05, {
              duration: 500,
              easing: Easing.bezier(0.31, 0.04, 0.03, 1.04),
            });
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
          }
        }),
      );
    })
    .onStart(() => {
      runOnJS(setIsVisible)(true);
      scale.value = withTiming(1, {
        duration: 250,
        easing: Easing.bezier(0.82, 0.06, 0.42, 1.01),
      });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onFinalize(() => {
      cancelAnimation(animationState);
      scale.value = withTiming(1, {
        duration: 250,
        easing: Easing.bezier(0.82, 0.06, 0.42, 1.01),
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View>
      <GestureDetector gesture={longPressGesture}>
        <Animated.View style={animatedStyle}>
          <Stack>{props.children}</Stack>
        </Animated.View>
      </GestureDetector>

      <Modal transparent visible={isVisible} animationType="fade">
        <BlurView
          intensity={80}
          tint="dark"
          style={styles.blurView}
          onTouchEnd={hideContextMenu}
        >
          <YStack flex={1} justifyContent="center" margin="$4" gap="$4">
            <View
              shadowColor="black"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={4}
              elevationAndroid={5}
            >
              {props.children}
            </View>
            <BlurView intensity={100} tint="dark" style={styles.menuBackground}>
              {props.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    option.onPress();
                    hideContextMenu();
                  }}
                >
                  <XStack
                    paddingVertical="$3"
                    paddingHorizontal="$4"
                    alignItems="center"
                    justifyContent="space-between"
                    borderTopWidth={index === 0 ? 0 : StyleSheet.hairlineWidth}
                    borderTopColor="rgba(255, 255, 255, 0.2)"
                  >
                    {option.label}
                    {option.icon}
                  </XStack>
                </TouchableOpacity>
              ))}
            </BlurView>
          </YStack>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  menuBackground: {
    overflow: "hidden",
    borderRadius: 16,
    marginHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: "black",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
