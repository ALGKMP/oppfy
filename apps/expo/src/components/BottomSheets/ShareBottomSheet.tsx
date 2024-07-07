import React, { useCallback, useRef, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type BottomSheet from "@gorhom/bottom-sheet";
import {
  Facebook,
  Instagram,
  Link,
  MessageCircle,
  QrCode,
  Twitter,
  Upload,
} from "@tamagui/lucide-icons";
import {
  Avatar,
  Button,
  ScrollView,
  Text,
  View,
} from "tamagui";

import BottomSheetWrapper from "./BottomSheetWrapper";

interface ShareBottomSheetProps {
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
  imageUrl: string; // S3 presigned URL
}

const ShareBottomSheet = (props: ShareBottomSheetProps) => {
  const { modalVisible, setModalVisible, imageUrl } = props;
  const sheetRef = useRef<BottomSheet>(null);
  const [isSharing, setIsSharing] = useState(false);

  const closeModal = useCallback(() => {
    sheetRef.current?.close();
    setModalVisible(false);
  }, [sheetRef, setModalVisible]);

  const openModal = useCallback(() => {
    sheetRef.current?.expand();
  }, [sheetRef]);

  const shareImage = async () => {
    setIsSharing(true);
    try {
      const fileUri = `${FileSystem.cacheDirectory}shared_image.jpg`;
      await FileSystem.downloadAsync(imageUrl, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Sharing is not available on your device");
      }
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("An error occurred while sharing the image");
    }
    setIsSharing(false);
  };

  const apps = [
    {
      name: "Share to...",
      icon: Upload,
      onPress: () => shareImage(),
    },
    {
      name: "Copy link",
      icon: Link,
      onPress: () => Alert.alert("Share to Instagram"),
    },
    {
      name: "Qr Code",
      icon: QrCode,
      onPress: () => Alert.alert("Share to Instagram"),
    },
    {
      name: "Messages",
      icon: MessageCircle,
      onPress: () => Alert.alert("Share to Instagram"),
    },
    {
      name: "Instagram",
      icon: Instagram,
      onPress: () => Alert.alert("Share to Instagram"),
    },
    {
      name: "X",
      icon: Twitter,
      onPress: () => Alert.alert("Share to Facebook"),
    },

    {
      name: "SnapChat",
      icon: Instagram,
      onPress: () => Alert.alert("Share to Facebook"),
    },
    {
      name: "Facebook",
      icon: Facebook,
      onPress: () => Alert.alert("Share to Facebook"),
    },
  ];

  return (
    <BottomSheetWrapper
      sheetRef={sheetRef}
      modalVisible={modalVisible}
      onClose={closeModal}
      onOpen={openModal}
      snapPoints={["20%"]}
    >
      <ScrollView horizontal flexDirection="row" paddingHorizontal="$4" borderTopColor="$gray8" borderTopWidth="$0.5">
        {apps.map((app, index) => (
          <TouchableOpacity key={index} onPress={app.onPress}>
            <View alignItems="center" marginHorizontal="$2.5" marginVertical="$3" borderRadius="$10">
              <Avatar circular size="$5"backgroundColor="$gray7" marginBottom="$2">
                <app.icon size="$2" margin="$1"/>
              </Avatar>
              <Text>{app.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BottomSheetWrapper>
  );
};

export default ShareBottomSheet;
