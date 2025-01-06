import React, { useCallback, useEffect, type ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { useTheme } from "tamagui";

import BottomSheetBackdrop from "./BottomSheetBackdrop";
import BottomSheetHeader from "./BottomSheetHeader";

export interface BottomSheetProps
  extends Partial<Omit<BottomSheetModalProps, "ref">> {
  title?: string;
  headerShown?: boolean;
  children: ReactNode;
  isVisible: boolean;
  onDismiss?: () => void;
  onPresent?: () => void;
}

export const BottomSheet = ({
  title,
  headerShown = true,
  children,
  snapPoints = ["50%"],
  isVisible,
  onDismiss,
  onPresent,
  ...props
}: BottomSheetProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
      onPresent?.();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, onPresent]);

  const header = useCallback(
    () => <BottomSheetHeader title={title ?? ""} />,
    [title],
  );

  const backdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} />,
    [],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBlurBehavior="restore"
      backdropComponent={backdropComponent}
      handleComponent={headerShown ? header : null}
      onDismiss={onDismiss}
      backgroundStyle={{
        backgroundColor: theme.gray4.val,
      }}
      topInset={insets.top}
      {...props}
    >
      <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
};
