import React, { useCallback, type ReactNode } from "react";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { Minus } from "@tamagui/lucide-icons";
import { SizableText, useTheme, View, YStack } from "tamagui";

export interface BottomSheetProps
  extends Partial<Omit<BottomSheetModalProps, "ref">> {
  title?: string;
  children: ReactNode;
}

export const BottomSheet = React.forwardRef<BottomSheetModal, BottomSheetProps>(
  (
    { title, children, snapPoints = ["50%"], backgroundStyle = {}, ...props },
    ref,
  ) => {
    const theme = useTheme();
    const internalRef = React.useRef<BottomSheetModal>(null);
    const bottomSheetRef = ref || internalRef;

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          {...backdropProps}
        />
      ),
      [],
    );

    const renderHeader = useCallback(() => {
      return (
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          position="relative"
        >
          <Minus size="$4" />
          {title && (
            <View justifyContent="center" alignItems="center">
              <SizableText size="$5" textAlign="center" fontWeight="bold">
                {title}
              </SizableText>
            </View>
          )}
          <View
            width="95%"
            borderColor="$gray8"
            borderWidth="$0.25"
            marginTop="$3"
          />
        </YStack>
      );
    }, [title]);

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        keyboardBlurBehavior="restore"
        backdropComponent={renderBackdrop}
        handleComponent={renderHeader}
        backgroundStyle={{
          backgroundColor: theme.gray4.val,
        }}
        {...props}
      >
        {children}
      </BottomSheetModal>
    );
  },
);
