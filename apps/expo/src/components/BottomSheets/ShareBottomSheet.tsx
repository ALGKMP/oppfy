import React, { useCallback, useRef } from "react";
import type BottomSheet from "@gorhom/bottom-sheet";
import { Text, View } from "tamagui";

import BottomSheetWrapper from "./BottomSheetWrapper";

interface ShareBottomSheetProps {
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
}

const ShareBottomSheet = (props: ShareBottomSheetProps) => {
  const { modalVisible, setModalVisible } = props;
  const sheetRef = useRef<BottomSheet>(null);

  const closeModal = useCallback(() => {
    sheetRef.current?.close();
    setModalVisible(false);
  }, [sheetRef, setModalVisible]);

  const openModal = useCallback(() => {
    sheetRef.current?.expand();
  }, [sheetRef]);

  return (
    <BottomSheetWrapper
      sheetRef={sheetRef}
      modalVisible={modalVisible}
      onClose={closeModal}
      onOpen={openModal}
      snapPoints={["50%", "90%"]}
    >
      <View>
        <Text>Text</Text>
      </View>
    </BottomSheetWrapper>
  );
};

export default ShareBottomSheet;
