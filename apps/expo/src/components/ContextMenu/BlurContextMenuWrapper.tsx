import React, { useState, useCallback } from "react";
import { Dimensions, Modal, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Stack, YStack, XStack, Text, View } from "tamagui";

const { width, height } = Dimensions.get("window");

interface Option {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface BlurContextMenuWrapperProps {
  children: React.ReactNode;
  options: Option[];
}

const BlurContextMenuWrapper: React.FC<BlurContextMenuWrapperProps> = ({ children, options }) => {
  const [isVisible, setIsVisible] = useState(false);
  const scale = useSharedValue(1);

  const showContextMenu = useCallback(() => {
    setIsVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const hideContextMenu = useCallback(() => {
    setIsVisible(false);
    scale.value = withTiming(1, { duration: 250, easing: Easing.bezier(0.82, 0.06, 0.42, 1.01) });
  }, [scale]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      scale.value = withTiming(1.05, {
        duration: 300,
        easing: Easing.bezier(0.31, 0.04, 0.03, 1.04),
      });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onFinalize(() => {
      runOnJS(showContextMenu)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View>
      <GestureDetector gesture={longPressGesture}>
        <Animated.View style={animatedStyle}>
          <Stack>{children}</Stack>
        </Animated.View>
      </GestureDetector>

      <Modal transparent visible={isVisible} animationType="fade">
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
          <Stack flex={1} justifyContent="center" padding="$4" gap="$4">
            <Stack>{children}</Stack>
            <BlurView intensity={30} tint="dark" style={styles.menuBackground}>
              <YStack overflow="hidden">
                {options.map((option, index) => (
                  <XStack
                    key={index}
                    paddingVertical="$3.5"
                    paddingHorizontal="$4"
                    alignItems="center"
                    justifyContent="space-between"
                    borderTopWidth={index === 0 ? 0 : StyleSheet.hairlineWidth}
                    borderTopColor="$borderColor"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => {
                      option.onPress();
                      hideContextMenu();
                    }}
                  >
                    <Text color="$color">{option.label}</Text>
                    {option.icon}
                  </XStack>
                ))}
              </YStack>
            </BlurView>
          </Stack>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  menuBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 24,
  },
});

export default BlurContextMenuWrapper;