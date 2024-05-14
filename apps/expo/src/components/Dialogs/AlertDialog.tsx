import React, { useCallback, useEffect, useState } from "react";
import { Animated, Modal } from "react-native";
import type { ParagraphProps, SizableTextProps } from "tamagui";
import { Button, Paragraph, SizableText, XStack, YStack } from "tamagui";

export interface AlertDialogProps {
  title: string;
  titleProps?: SizableTextProps;

  subtitle?: string;
  subtitleProps?: ParagraphProps;

  isVisible?: boolean;
  trigger?: React.ReactElement;

  onCancel?: () => void;
  onAccept?: () => void;
}

const AlertDialog = ({
  title,
  titleProps,
  subtitle,
  subtitleProps,

  trigger,
  isVisible,
  onCancel,
  onAccept,
}: AlertDialogProps) => {
  const [showModal, setShowModal] = useState(false);
  const [opacityAnimation] = useState(new Animated.Value(0));

  const openModal = useCallback(() => {
    setShowModal(true);
    Animated.timing(opacityAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [opacityAnimation]);

  const closeModal = useCallback(() => {
    Animated.timing(opacityAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
    });
  }, [opacityAnimation]);

  useEffect(() => {
    if (isVisible) {
      openModal();
    } else {
      closeModal();
    }
  }, [isVisible, openModal, closeModal]);

  const TriggerElement = trigger
    ? React.cloneElement(trigger, { onPress: openModal })
    : null;

  return (
    <>
      {TriggerElement}
      <Modal
        animationType="none"
        transparent={true}
        visible={showModal}
        onRequestClose={closeModal}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            opacity: opacityAnimation,
          }}
        >
          <YStack
            width={300}
            alignItems="center"
            paddingHorizontal="$4"
            paddingVertical="$6"
            backgroundColor="$color4"
            borderRadius={9}
            gap="$2"
          >
            <SizableText size="$5" fontWeight="bold" {...titleProps}>
              {title}
            </SizableText>

            {subtitle && (
              <Paragraph textAlign="center" theme="alt2" {...subtitleProps}>
                {subtitle}
              </Paragraph>
            )}

            <XStack gap="$4">
              <Button
                size="$5"
                color="$blue9"
                theme="alt1"
                onPress={() => {
                  onCancel?.();
                  closeModal();
                }}
              >
                Cancel
              </Button>

              <Button
                size="$5"
                color="$red9"
                theme="alt2"
                onPress={() => {
                  onAccept?.();
                  closeModal();
                }}
              >
                Accept
              </Button>
            </XStack>
          </YStack>
        </Animated.View>
      </Modal>
    </>
  );
};

export default AlertDialog;
