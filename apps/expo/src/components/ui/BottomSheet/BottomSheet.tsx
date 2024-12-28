import React, { useCallback, useEffect, type ReactNode } from "react";
import {
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { useTheme } from "tamagui";

import BottomSheetBackdrop from "./BottomSheetBackdrop";
import BottomSheetHeader from "./BottomSheetHeader";

export interface BottomSheetProps
  extends Partial<Omit<BottomSheetModalProps, "ref">> {
  title?: string;
  children: ReactNode;
  isVisible: boolean;
  onDismiss?: () => void;
  onPresent?: () => void;
}

export const BottomSheet = React.forwardRef<BottomSheetModal, BottomSheetProps>(
  ({
    title,
    children,
    snapPoints = ["50%"],
    isVisible,
    onDismiss,
    onPresent,
    ...props
  }) => {
    const theme = useTheme();
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
        handleComponent={header}
        onDismiss={onDismiss}
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
