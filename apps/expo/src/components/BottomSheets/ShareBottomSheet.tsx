import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type BottomSheet from "@gorhom/bottom-sheet";
import { Instagram } from "@tamagui/lucide-icons";

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

  return (
    <BottomSheetWrapper
      sheetRef={sheetRef}
      modalVisible={modalVisible}
      onClose={closeModal}
      onOpen={openModal}
      snapPoints={["50%", "90%"]}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Share Post</Text>
        <ScrollView horizontal style={styles.appsContainer}>
          {/* Add app icons here */}
          <View style={styles.appItem}>
            <Instagram />
            <Text>Snapchat</Text>
          </View>
          <View style={styles.appItem}>
            <Instagram />
            <Text>Instagram</Text>
          </View>
          <View style={styles.appItem}>
            <Instagram />
            <Text>iMessage</Text>
          </View>
          {/* Add more app icons as needed */}
        </ScrollView>
        <Button
          title={isSharing ? "Sharing..." : "Share to Other Apps"}
          onPress={shareImage}
          disabled={isSharing}
        />
      </View>
    </BottomSheetWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  appsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  appItem: {
    alignItems: "center",
    marginRight: 16,
  },
  appIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
});

export default ShareBottomSheet;
