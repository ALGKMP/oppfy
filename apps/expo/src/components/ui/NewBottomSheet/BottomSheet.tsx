import React, { useCallback, useEffect, type ReactNode } from "react";
import {
  // BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import BottomSheetBackdrop from "./BottomSheetBackdrop";
import BottomSheetHeader from "./BottomSheetHeader";
import { Minus } from "@tamagui/lucide-icons";
import { SizableText, useTheme, View, YStack } from "tamagui";

export interface BottomSheetProps
  extends Partial<Omit<BottomSheetModalProps, "ref">> {
  title?: string;
  children: ReactNode;
  isVisible: boolean;
  onDismiss?: () => void;
}

export const BottomSheet = React.forwardRef<BottomSheetModal, BottomSheetProps>(
  (
    { title, children, snapPoints = ["50%"], isVisible, onDismiss, ...props },
  ) => {
    const theme = useTheme();
    const bottomSheetRef = React.useRef<BottomSheetModal>(null);

    useEffect(() => {
      if (isVisible) {
        bottomSheetRef.current?.present();
      } else {
        bottomSheetRef.current?.dismiss();
      }
    }, [isVisible]);


    // const renderBackdrop = useCallback(
    //   (backdropProps: BottomSheetBackdropProps) => (
    //     <BottomSheetBackdrop
    //       appearsOnIndex={0}
    //       disappearsOnIndex={-1}
    //       opacity={0.5}
    //       {...backdropProps}
    //     />
    //   ),
    //   [],
    // );

    // const renderHeader = useCallback(() => {
    //   return (
    //     <YStack
    //       flex={1}
    //       justifyContent="center"
    //       alignItems="center"
    //       position="relative"
    //     >
    //       <Minus size="$4" />
    //       {title && (
    //         <View justifyContent="center" alignItems="center">
    //           <SizableText size="$5" textAlign="center" fontWeight="bold">
    //             {title}
    //           </SizableText>
    //         </View>
    //       )}
    //       <View
    //         width="95%"
    //         borderColor="$gray8"
    //         borderWidth="$0.25"
    //         marginTop="$3"
    //       />
    //     </YStack>
    //   );
    // }, [title]);

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
