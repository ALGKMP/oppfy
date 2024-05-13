import React, { ReactElement, useCallback, useEffect, useState } from "react";
import {
  Animated,
  ButtonProps,
  Easing,
  Modal,
  TouchableOpacityProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ParagraphProps, SizableTextProps } from "tamagui";
import {
  Button,
  Paragraph,
  Separator,
  SizableText,
  View,
  YStack,
} from "tamagui";

export interface ButtonOption {
  text: string;
  textProps?: SizableTextProps;
  onPress?: () => void;
}

export interface ActionSheetProps {
  title: string;
  titleProps?: SizableTextProps;

  subtitle?: string;
  subtitleProps?: ParagraphProps;

  buttonOptions: ButtonOption[];

  trigger?: ReactElement<ButtonProps>;
  isVisible?: boolean;
  onClose?: () => void;
}

const ActionSheet = ({
  title,
  titleProps,
  subtitle,
  subtitleProps,
  buttonOptions,

  trigger,
  isVisible,
  onClose,
}: ActionSheetProps) => {
  const insets = useSafeAreaInsets();

  const [showModal, setShowModal] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(300));
  const [backgroundOpacity] = useState(new Animated.Value(0));

  const closeModal = useCallback(() => {
    setShowModal(true);
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backgroundOpacity, slideAnimation]);

  const openModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(slideAnimation, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => {
      setShowModal(false);
    });
  }, [backgroundOpacity, slideAnimation]);

  useEffect(() => {
    isVisible ? closeModal() : openModal();
  }, [isVisible, backgroundOpacity, slideAnimation, closeModal, openModal]);

  const TriggerElement = trigger
    ? React.cloneElement(trigger, {
        onPress: () => openModal,
      })
    : null;

  return (
    <>
      {TriggerElement}
      <Modal
        animationType="none"
        transparent={true}
        visible={showModal}
        onRequestClose={onClose}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            opacity: backgroundOpacity,
          }}
        >
          <Animated.View
            style={{
              transform: [{ translateY: slideAnimation }],
            }}
          >
            <YStack
              gap="$3"
              paddingHorizontal="$4"
              paddingBottom={insets.bottom}
            >
              <YStack>
                <YStack
                  padding="$4"
                  alignItems="center"
                  backgroundColor="$color4"
                  borderTopLeftRadius={9}
                  borderTopRightRadius={9}
                >
                  <SizableText size="$5" fontWeight="bold" {...titleProps}>
                    {title}
                  </SizableText>

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

                {buttonOptions.map((option, index) => (
                  <View key={index}>
                    <Separator theme="alt1" />
                    <Button
                      size="$5"
                      borderTopLeftRadius={0}
                      borderTopRightRadius={0}
                      borderBottomLeftRadius={
                        index === buttonOptions.length - 1 ? 9 : 0
                      }
                      borderBottomRightRadius={
                        index === buttonOptions.length - 1 ? 9 : 0
                      }
                      onPress={option.onPress}
                    >
                      <SizableText size="$5" {...option.textProps}>
                        {option.text}
                      </SizableText>
                    </Button>
                  </View>
                ))}
              </YStack>
              <Button size="$5" color="$blue9" onPress={onClose}>
                Cancel
              </Button>
            </YStack>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

export default ActionSheet;
