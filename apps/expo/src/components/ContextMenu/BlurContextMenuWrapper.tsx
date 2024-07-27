import React, { ReactNode, useState } from "react";
import { Dimensions, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Stack, View, XStack, YStack } from "tamagui";

const { width, height } = Dimensions.get("window");

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

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onBegin(() => {
      scale.value = withTiming(1.05, {
        duration: 500,
        easing: Easing.bezier(0.31, 0.04, 0.03, 1.04),
      });
    })
    .onStart(() => {
      runOnJS(setIsVisible)(true);
      scale.value = withTiming(1, {
        duration: 250,
        easing: Easing.bezier(0.82, 0.06, 0.42, 1.01),
      });
    })
    .onFinalize(() => {
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
        <BlurView
          intensity={50}
          style={styles.blurView}
          tint="light"
          onTouchEnd={hideContextMenu}
        >
          <YStack flex={1}>
            <View flex={1} justifyContent="center" margin="$4" gap="$4">
              {props.children}
              <YStack
                borderRadius="$5"
                backgroundColor="rgba(63, 63, 62, 0.8)"
                marginHorizontal="$6"
              >
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
              </YStack>
            </View>
          </YStack>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  blurView: {
    position: "absolute",
    width,
    height,
  },
  background: {
    position: "absolute",
    width,
    height,
  },
});

export default BlurContextMenuWrapper;
