import { useCallback, useEffect, useMemo, useRef } from "react";
import { Dimensions, Modal, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";
import {
  AlertCircle,
  ArrowDownToLine,
  Minus,
  QrCode,
  Trash2,
} from "@tamagui/lucide-icons";
import { Separator, Text, View, XStack, YStack } from "tamagui";

import useSaveVideo from "~/hooks/useSaveMedia";
import BottomSheetWrapper from "./BottomSheetWrapper";

interface PostActionBottomSheetProps {
  postId: number;
  isSelfPost: boolean;
  url: string;
  mediaType: "image" | "video";
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
  setReportActionSheetVisible: (value: boolean) => void;
  setDeleteActionSheetVisible: (value: boolean) => void;
}

const PostActionsBottomSheet = (props: PostActionBottomSheetProps) => {
  const {
    isSelfPost,
    url,
    mediaType,
    modalVisible,
    setModalVisible,
    setReportActionSheetVisible,
    setDeleteActionSheetVisible,
  } = props;
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useMemo(() => Dimensions.get("window"), []);
  const sheetRef = useRef<BottomSheet>(null);
  const { saveState, saveToCameraRoll } = useSaveVideo();

  const bottomInsetPercentage = (insets.bottom / screenHeight) * 100;

  const openModal = useCallback(() => {
    sheetRef.current?.expand();
  }, [sheetRef]);

  const closeModal = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.close();
      // Delay this shit so the animation can finish
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    } else {
      setModalVisible(false);
    }
  }, [sheetRef, setModalVisible]);

  useEffect(() => {
    if (modalVisible) {
      openModal();
    } else {
      closeModal();
    }
  }, [modalVisible, closeModal, openModal]);

  const renderHeader = useCallback(() => {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Minus size="$4" />
      </View>
    );
  }, []);

  return (
    <BottomSheetWrapper
      sheetRef={sheetRef}
      modalVisible={modalVisible}
      onClose={closeModal}
      onOpen={openModal}
      topInset={insets.top}
      handleComponent={renderHeader}
    >
      <YStack
        flex={1}
        marginHorizontal="$4"
        gap="$4"
        paddingBottom={insets.bottom !== 0 ? insets.bottom : "$4"}
        borderTopColor="$gray5"
        borderTopWidth="$0.25"
      >
        <YStack borderRadius="$7" backgroundColor="rgba(63, 63, 62, 0.3)">
          <TouchableOpacity
            onPress={async () => {
              await saveToCameraRoll({
                uri: url,
                isNetworkUrl: true,
                mediaType,
              });
              closeModal();
            }}
          >
            <XStack
              gap="$4"
              padding="$4"
              alignItems="center"
              justifyContent="flex-start"
            >
              <ArrowDownToLine />
              <Text>Save post</Text>
            </XStack>
            <Separator borderColor="white" borderWidth={0.5} opacity={0.3} />
          </TouchableOpacity>
          {isSelfPost && (
            <TouchableOpacity
              onPress={() => {
                setTimeout(() => {
                  setDeleteActionSheetVisible(true);
                }, 300);
                closeModal();
              }}
            >
              <XStack
                gap="$4"
                padding="$4"
                alignItems="center"
                justifyContent="flex-start"
              >
                <Trash2 />
                <Text>Delete post</Text>
              </XStack>
              <Separator borderColor="white" borderWidth={0.5} opacity={0.3} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              setTimeout(() => {
                setReportActionSheetVisible(true);
              }, 300); // Gotta add a timeout to this shit because of the timeout in closeModal idfk just go with it
              closeModal();
            }}
          >
            <XStack
              gap="$4"
              padding="$4"
              alignItems="center"
              justifyContent="flex-start"
            >
              <AlertCircle color="red" />
              <Text color="red">Report</Text>
            </XStack>
          </TouchableOpacity>
        </YStack>
      </YStack>
    </BottomSheetWrapper>
  );
};

export default PostActionsBottomSheet;
