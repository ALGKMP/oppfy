import React, { useCallback, useRef, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type BottomSheet from "@gorhom/bottom-sheet";
import {
  CreativeKit,
  MetadataParams,
  PhotoContentParams,
  VideoContentParams,
  VideoData,
} from "@snapchat/snap-kit-react-native";
import { widths } from "@tamagui/config";
import {
  Facebook,
  Instagram,
  Link,
  MessageCircle,
  QrCode,
  Twitter,
  Upload,
} from "@tamagui/lucide-icons";
import { Avatar, ScrollView, Text, View } from "tamagui";

import useSaveMedia from "~/hooks/useSaveMedia";
import BottomSheetWrapper from "./BottomSheetWrapper";

interface ShareBottomSheetProps {
  postId: number;
  modalVisible: boolean;
  mediaType: "image" | "video";
  setModalVisible: (value: boolean) => void;
  imageUrl: string; // S3 presigned URL
}

const ShareBottomSheet = (props: ShareBottomSheetProps) => {
  const { modalVisible, setModalVisible, imageUrl, postId, mediaType } = props;
  const sheetRef = useRef<BottomSheet>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { deleteCachedMedia, cacheMediaWithWatermark } = useSaveMedia();

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

  const shareFullImageToSnapchat = async ({ uri }: { uri: string }) => {
    try {
      const processesedUri = await cacheMediaWithWatermark({
        presignedUrl: uri,
        fileName: "shared_image",
        mediaType: "image",
      });
      if (!processesedUri) {
        throw new Error("Failed to cache image file");
      }
      console.log(processesedUri);
      const metadata: PhotoContentParams = {
        content: {
          uri: `file://${processesedUri}`,
        },
        // attachmentUrl: `https://www.oppfy.app/post/`,
      };
      await CreativeKit.shareToCameraPreview(metadata);
    } catch (error) {
      console.error("Error sharing image to Snapchat:", error);
      Alert.alert("An error occurred while sharing the image to Snapchat");
    }
  };

  const shareImageAsStickerToSnapchat = async ({ uri }: { uri: string }) => {
    try {
      const processesedUri = await cacheMediaWithWatermark({
        presignedUrl: uri,
        fileName: "shared_image",
        mediaType: "image",
      });
      if (!processesedUri) {
        throw new Error("Failed to cache image file");
      }
      const metadata: MetadataParams = {
        sticker: {
          uri: `file://${processesedUri}`,
          height: 500,
          width: 500,
          posX: 0.5,
          posY: 0.5,
        },
        attachmentUrl: `https://www.oppfy.app/post/`,
      };
      await CreativeKit.shareToCameraPreview(metadata);
    } catch (error) {
      console.error("Error sharing image to Snapchat:", error);
      Alert.alert("An error occurred while sharing the image to Snapchat");
    }
  };

  const _sharePostUrlToSnapChat = async ({
    uri,
    postId,
  }: {
    uri: string;
    postId: number;
  }) => {
    try {
      const processesedUri = await cacheMediaWithWatermark({
        presignedUrl: uri,
        fileName: "shared_image",
        mediaType: "image",
      });
      if (!processesedUri) {
        throw new Error("Failed to cache image file");
      }
      const metadata: MetadataParams = {
        sticker: {
          uri: `file://${processesedUri}`,
          height: 500,
          width: 500,
          posX: 0.5,
          posY: 0.5,
        },
        attachmentUrl: `https://www.oppfy.app/post/`,
      };
      await CreativeKit.shareToCameraPreview(metadata);
    } catch (error) {
      console.error("Error sharing image to Snapchat:", error);
      Alert.alert("An error occurred while sharing the image to Snapchat");
    }
  };

  const shareVideoUrlToSnapchat = async () => {
    try {
      const fileUri = await cacheMediaWithWatermark({
        presignedUrl: imageUrl,
        fileName: "shared_video",
        mediaType: "video",
      });
      if (!fileUri) {
        throw new Error("Failed to cache video file");
      }

      const videoData: VideoContentParams = {
        content: {
          uri: fileUri,
        },
        attachmentUrl: "https://oppfy.app",
      };
      await CreativeKit.shareVideo(videoData);
      await deleteCachedMedia(fileUri);
    } catch (error) {
      console.error("Error sharing video to Snapchat:", error);
      Alert.alert("An error occurred while sharing the video to Snapchat");
    }
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
      onPress: async () => {
        if (props.mediaType === "video") {
          await shareVideoUrlToSnapchat();
        } else {
          // await shareFullImageToSnapchat({ uri: imageUrl });
          // await shareImageAsStickerToSnapchat({ uri: imageUrl });
          await _sharePostUrlToSnapChat({ uri: imageUrl, postId });
        }
      },
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
      <ScrollView
        horizontal
        flexDirection="row"
        paddingHorizontal="$4"
        borderTopColor="$gray8"
        borderTopWidth="$0.5"
      >
        {apps.map((app, index) => (
          <TouchableOpacity key={index} onPress={app.onPress}>
            <View
              alignItems="center"
              marginHorizontal="$2.5"
              marginVertical="$3"
              borderRadius="$10"
            >
              <Avatar
                circular
                size="$5"
                backgroundColor="$gray7"
                marginBottom="$2"
              >
                <app.icon size="$2" margin="$1" />
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
