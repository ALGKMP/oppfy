import { useCallback, useEffect, useMemo, useRef } from "react";
import { Dimensions, Modal, TouchableOpacity } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";
import { Minus } from "@tamagui/lucide-icons";
import { View } from "tamagui";

interface PostActionBottomSheetProps {
  postId: number;
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
}

const PostActionsBottomSheet = ({
  postId,
  modalVisible,
  setModalVisible,
}: PostActionBottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useMemo(() => Dimensions.get("window"), []);
  const sheetRef = useRef<BottomSheet>(null);

  const openModal = useCallback(() => {
    sheetRef.current?.expand();
  }, [sheetRef]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    sheetRef.current?.close();
  }, [sheetRef, setModalVisible]);

  useEffect(() => {
    if (modalVisible) {
      openModal();
    } else {
      closeModal();
    }
  }, [modalVisible, closeModal, openModal]);

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
      <TouchableOpacity onPress={closeModal} />
      <Animated.View style={[animatedOverlayStyle, { flex: 1 }]}>
        <BottomSheet
          onClose={closeModal}
          snapPoints={["60%"]}
          enablePanDownToClose={true}
          animatedPosition={animatedPosition}
          backgroundStyle={{ backgroundColor: "#282828" }}
          handleComponent={renderHeader}
          ref={sheetRef}
        >
          {/* Add a childrens prop */}
          <></>
        </BottomSheet>
      </Animated.View>
    </Modal>
  );
};

export default PostActionsBottomSheet;
