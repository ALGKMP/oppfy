import React, { useCallback, useEffect } from "react";
import { Dimensions, Modal } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import BottomSheet, { type BottomSheetProps } from "@gorhom/bottom-sheet";
import { Minus } from "@tamagui/lucide-icons";
import { View } from "tamagui";

interface BottomSheetWrapperProps extends Partial<BottomSheetProps> {
  sheetRef: React.RefObject<BottomSheet>;
  modalVisible: boolean;
  onOpen: () => void;
  onClose: () => void;
  snapPoints: string[];
  children: React.ReactNode;
}

const screenHeight = Dimensions.get("window").height;

const BottomSheetWrapper = (props: BottomSheetWrapperProps) => {
  const {
    modalVisible,
    snapPoints,
    onClose,
    onOpen,
    children,
    sheetRef,
    ...bottomSheetProps
  } = props;

  useEffect(() => {
    if (modalVisible) {
      onOpen();
    } else {
      onClose();
    }
  }, [modalVisible, onClose, onOpen]);

  const animatedPosition = useSharedValue(0);
  const animatedOverlayStyle = useAnimatedStyle(() => {
    const heightPercentage = animatedPosition.value / screenHeight;
    const opacity = interpolate(
      heightPercentage,
      [0.2, 0.9],
      [0.9, 0],
      "clamp",
    );
    return { backgroundColor: `rgba(0, 0, 0, ${opacity})` };
  });

  const renderHeader = useCallback(() => {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Minus size="$4" />
      </View>
    );
  }, []);

  return (
    <Modal visible={modalVisible} transparent={true}>
      <Animated.View style={[{ flex: 1 }, animatedOverlayStyle]}>
        <BottomSheet
          ref={sheetRef}
          onClose={onClose}
          enablePanDownToClose
          snapPoints={snapPoints}
          animatedPosition={animatedPosition}
          handleComponent={renderHeader}
          backgroundStyle={{
            backgroundColor: "#282828",
          }}
          {...bottomSheetProps}
        >
          {children}
        </BottomSheet>
      </Animated.View>
    </Modal>
  );
};

export default BottomSheetWrapper;
