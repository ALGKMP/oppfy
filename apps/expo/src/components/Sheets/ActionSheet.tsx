import type { ReactElement } from "react";
import React, { useCallback, useEffect, useState } from "react";
import type { ButtonProps } from "react-native";
import { Animated, Easing, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ParagraphProps, SizableTextProps } from "tamagui";
import {
  Avatar,
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
  imageUrl?: string;

  title: string;
  titleProps?: SizableTextProps;

  subtitle?: string;
  subtitleProps?: ParagraphProps;

  buttonOptions: ButtonOption[];

  isVisible?: boolean;
  trigger?: ReactElement<ButtonProps>;

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
  const insets = useSafeAreaInsets();

  const [showModal, setShowModal] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(300));
  const [backgroundOpacity] = useState(new Animated.Value(0));

  const openModal = useCallback(() => {
    setShowModal(true);
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backgroundOpacity, slideAnimation]);

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(slideAnimation, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => {
      setShowModal(false);
      onCancel?.(); // Call onCancel callback if provided
    });
  }, [backgroundOpacity, slideAnimation, onCancel]);

  useEffect(() => {
    isVisible ? openModal() : closeModal();
  }, [isVisible, openModal, closeModal]);

  const TriggerElement = trigger
    ? React.cloneElement(trigger, {
        onPress: openModal,
      })
    : null;

  return (
    <>
      {TriggerElement}
      <Modal
        animationType="none"
        transparent={true}
        visible={showModal}
        onRequestClose={closeModal} // Use closeModal directly
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
              paddingHorizontal="$4"
              paddingBottom={insets.bottom}
              gap="$3"
            >
              <YStack>
                <YStack
                  padding="$4"
                  alignItems="center"
                  backgroundColor="$color4"
                  borderTopLeftRadius={9}
                  borderTopRightRadius={9}
                  gap="$2"
                >
                  {imageUrl && (
                    <Avatar circular bordered size="$6">
                      <Avatar.Image src={imageUrl} />
                    </Avatar>
                  )}

                  <YStack alignItems="center">
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
                </YStack>

                {buttonOptions.map((option, index) => (
                  <View
                    key={index}
                    borderTopWidth={index === 0 ? 0 : 0.2}
                    borderColor="$gray10"
                  >
                    {/* <Separator theme="alt1" /> */}
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
                      onPress={() => {
                        option.onPress?.();
                        closeModal();
                      }}
                    >
                      <SizableText size="$5" {...option.textProps}>
                        {option.text}
                      </SizableText>
                    </Button>
                  </View>
                ))}
              </YStack>
              <Button size="$5" color="$blue9" onPress={closeModal}>
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
