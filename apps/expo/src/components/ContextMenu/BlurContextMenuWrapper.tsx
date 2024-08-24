import type { ReactNode } from "react";
import React, { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity } from "react-native";
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

const BlurContextMenuWrapper = (props: BlurContextMenuWrapperProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const scale = useSharedValue(1);
  const animationState = useSharedValue(0);

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
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

  const hideContextMenu = () => setIsVisible(false);

  return (
    <View>
      <GestureDetector gesture={longPressGesture}>
        <Animated.View style={animatedStyle}>
          <Stack>{props.children}</Stack>
        </Animated.View>
      </GestureDetector>

      <Modal transparent={true} visible={isVisible} animationType="fade">
        <BlurView style={styles.blurView} onTouchEnd={hideContextMenu}>
          <View flex={1} justifyContent="center" margin="$4" gap="$4">
            <View
              shadowColor="black"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={4}
            >
              {props.children}
            </View>
            <BlurView tint="dark" style={styles.menuBackground}>
              {props.options.map((option, index) => (
                <TouchableOpacity key={index} onPress={option.onPress}>
                  <XStack
                    paddingVertical="$3"
                    paddingHorizontal="$4"
                    alignItems="center"
                    justifyContent="space-between"
                    borderTopWidth={index === 0 ? 0 : 0.3}
                    borderTopColor="white"
                  >
                    {option.label}
                    {option.icon}
                  </XStack>
                </TouchableOpacity>
              ))}
            </BlurView>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  blurView: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  background: {
    position: "absolute",
  },
  menuBackground: {
    overflow: "hidden",
    borderRadius: 16,
    marginHorizontal: 24,
  },
});

export default BlurContextMenuWrapper;
