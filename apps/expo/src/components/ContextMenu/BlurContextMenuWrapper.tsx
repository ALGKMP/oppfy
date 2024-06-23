// BlurContextMenuWrapper.tsx
import React, { ReactNode, useState } from "react";
import { Dimensions, Modal, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import {
  Stack,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

type Option = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

type BlurContextMenuWrapperProps = {
  children: ReactNode;
  options: Option[];
};

const BlurContextMenuWrapper = (props : BlurContextMenuWrapperProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();

  const longPressGesture = Gesture.LongPress().onEnd(() => {
    runOnJS(setIsVisible)(true);
  });

  const hideContextMenu = () => setIsVisible(false);

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(hideContextMenu)();
  });

  return (
    <>
      <GestureDetector gesture={longPressGesture}>
        <Stack>{props.children}</Stack>
      </GestureDetector>

      <Modal
        transparent={true}
        visible={isVisible}
        animationType="fade"
        onRequestClose={hideContextMenu}
      >
        <GestureDetector gesture={tapGesture}>
          <Stack flex={1} justifyContent="center" alignItems="center">
            <BlurView intensity={50} style={styles.blurView} tint="light">
              <Stack style={styles.background} />
              <YStack
                backgroundColor={theme.background}
                borderRadius="$4"
                padding="$4"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.2}
                shadowRadius={3}
                elevation={5}
                maxWidth={300}
                alignSelf="center"
              >
                {props.options.map((option, index) => (
                  <GestureDetector
                    key={index}
                    gesture={Gesture.Tap().onEnd(() => {
                      // runOnJS(option.onPress)();
                      runOnJS(hideContextMenu)();
                    })}
                  >
                    <XStack
                      paddingVertical="$2"
                      borderBottomWidth={index < props.options.length - 1 ? 1 : 0}
                      borderBottomColor="$border"
                      alignItems="center"
                    >
                      {option.icon}
                      <Text marginLeft="$2" fontSize="$6">
                        {option.label}
                      </Text>
                    </XStack>
                  </GestureDetector>
                ))}
              </YStack>
            </BlurView>
          </Stack>
        </GestureDetector>
      </Modal>
    </>
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
