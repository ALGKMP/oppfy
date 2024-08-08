import React, { useCallback, useEffect, useState } from "react";
import { Modal, Platform, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import type { ButtonProps, ParagraphProps, SizableTextProps } from "tamagui";
import {
  Button,
  Paragraph,
  Separator,
  SizableText,
  View,
  XStack,
  YStack,
} from "tamagui";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

export interface AlertDialogProps {
  title: string;
  titleProps?: SizableTextProps;
  subtitle?: string;
  subtitleProps?: ParagraphProps;
  isVisible?: boolean;
  trigger?: React.ReactElement;
  onCancel?: () => void;
  onAccept?: () => void;
  cancelText?: string;
  acceptText?: string;
  cancelTextProps?: SizableTextProps;
  acceptTextProps?: SizableTextProps;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  title,
  titleProps,
  subtitle,
  subtitleProps,
  trigger,
  isVisible,
  onCancel,
  onAccept,
  cancelText = "Cancel",
  acceptText = "Accept",
  cancelTextProps,
  acceptTextProps,
}) => {
  const [showModal, setShowModal] = useState(false);
  const animation = useSharedValue(0);

  const openModal = useCallback(() => {
    setShowModal(true);
    animation.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [animation]);

  const closeModal = useCallback(() => {
    animation.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setShowModal)(false);
      }
    });
  }, [animation]);

  useEffect(() => {
    if (isVisible) {
      openModal();
    } else {
      closeModal();
    }
  }, [isVisible, openModal, closeModal]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animation.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          animation.value,
          [0, 1],
          [0.9, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handleCancel = useCallback(() => {
    closeModal();
    onCancel && runOnJS(onCancel)();
  }, [closeModal, onCancel]);

  const handleAccept = useCallback(() => {
    closeModal();
    onAccept && runOnJS(onAccept)();
  }, [closeModal, onAccept]);

  const TriggerElement = trigger
    ? React.cloneElement(trigger, { onPress: openModal })
    : null;

  return (
    <>
      {TriggerElement}
      <Modal
        transparent={true}
        visible={showModal}
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <Animated.View style={[styles.overlay, backgroundStyle]}>
          <BlurView intensity={10} style={StyleSheet.absoluteFill} />
          <AnimatedYStack
            width={300}
            borderRadius="$6"
            alignItems="center"
            backgroundColor="$background"
            style={containerStyle}
          >
            <YStack paddingHorizontal="$6" paddingVertical="$4" gap>
              <SizableText
                size="$6"
                fontWeight="bold"
                textAlign="center"
                {...titleProps}
              >
                {title}
              </SizableText>
              {subtitle && (
                <Paragraph textAlign="center" theme="alt2" {...subtitleProps}>
                  {subtitle}
                </Paragraph>
              )}
            </YStack>
            <YStack>
              <Separator />
              <XStack>
                <TouchableOpacity
                  onPress={() => {
                    handleCancel();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    width: 150,
                    padding: 12,
                    borderRadius: 4,
                    alignItems: "center",
                  }}
                >
                  <SizableText size="$5" color="$blue9" {...cancelTextProps}>
                    {cancelText}
                  </SizableText>
                </TouchableOpacity>
                <Separator vertical />
                <TouchableOpacity
                  onPress={() => {
                    handleAccept();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    width: 150,
                    padding: 12,
                    borderRadius: 4,
                    alignItems: "center",
                  }}
                >
                  <SizableText
                    size="$5"
                    color="$red9"
                    fontWeight="bold"
                    {...acceptTextProps}
                  >
                    {acceptText}
                  </SizableText>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </AnimatedYStack>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
});

export default AlertDialog;
