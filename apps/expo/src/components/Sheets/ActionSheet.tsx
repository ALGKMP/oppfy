import React, { useCallback, useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { ActivityIndicator, Modal, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import type { ParagraphProps, SizableTextProps } from "tamagui";
import {
  Paragraph,
  Separator,
  SizableText,
  useTheme,
  View,
  YStack,
} from "tamagui";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

export interface ButtonOption {
  text: string;
  textProps?: SizableTextProps;
  onPress?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface ActionSheetProps {
  imageUrl?: string | ImageSourcePropType;
  title?: string;
  titleProps?: SizableTextProps;
  subtitle?: string;
  subtitleProps?: ParagraphProps;
  buttonOptions: ButtonOption[];
  isVisible?: boolean;
  trigger?: React.ReactElement;
  onCancel?: () => void;
}

const ActionSheet = ({
  imageUrl,
  title,
  titleProps,
  subtitle,
  subtitleProps,
  buttonOptions,
  trigger,
  isVisible,
  onCancel,
}: ActionSheetProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
        onCancel && runOnJS(onCancel)();
      }
    });
  }, [animation, onCancel]);

  useEffect(() => {
    if (isVisible && !showModal) {
      openModal();
    } else if (!isVisible && showModal) {
      closeModal();
    }
  }, [closeModal, isVisible, openModal, showModal]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value, [0, 1], [0, 1], Extrapolation.CLAMP),
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
        translateY: interpolate(
          animation.value,
          [0, 1],
          [300, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

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
            width="100%"
            paddingHorizontal="$2"
            paddingBottom={insets.bottom}
            style={containerStyle}
            gap="$2"
          >
            <YStack
              borderRadius="$6"
              backgroundColor="$gray2"
              overflow="hidden"
            >
              {(imageUrl ?? title ?? subtitle) && (
                <>
                  <YStack
                    backgroundColor="$background"
                    padding="$4"
                    alignItems="center"
                    gap="$2"
                  >
                    {imageUrl && (
                      <Image
                        source={imageUrl}
                        style={{ width: 100, height: 100, borderRadius: 50 }}
                      />
                    )}
                    {title && (
                      <SizableText
                        size="$6"
                        fontWeight="bold"
                        textAlign="center"
                        {...titleProps}
                      >
                        {title}
                      </SizableText>
                    )}
                    {subtitle && (
                      <Paragraph
                        textAlign="center"
                        theme="alt2"
                        {...subtitleProps}
                      >
                        {subtitle}
                      </Paragraph>
                    )}
                  </YStack>
                  <Separator />
                </>
              )}
              {buttonOptions.map((option, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Separator />}
                  <TouchableOpacity
                    onPress={() => {
                      if (!option.disabled) {
                        option.onPress?.();
                        void Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light,
                        );
                        closeModal();
                      }
                    }}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: theme.gray1.val,
                        opacity: option.disabled ? 0.5 : 1,
                      },
                    ]}
                    disabled={option.disabled}
                  >
                    <View style={styles.buttonContent}>
                      {option.icon && (
                        <View style={styles.iconContainer}>{option.icon}</View>
                      )}
                      <SizableText size="$5" {...option.textProps}>
                        {option.text}
                      </SizableText>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </YStack>
            <View
              backgroundColor="$background"
              overflow="hidden"
              borderRadius="$6"
            >
              <TouchableOpacity
                onPress={closeModal}
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: theme.gray2.val,
                  },
                ]}
              >
                <SizableText size="$5" color="$blue9">
                  Cancel
                </SizableText>
              </TouchableOpacity>
            </View>
          </AnimatedYStack>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  optionButton: {
    padding: 16,
    alignItems: "center",
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: 8,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
});

export default ActionSheet;
