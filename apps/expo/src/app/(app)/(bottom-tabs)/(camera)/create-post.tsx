import React, { useEffect, useState } from "react";
import { Dimensions, Image as RNImage, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";

import { BaseScreenView } from "~/components/Views";

const { width: windowWidth } = Dimensions.get("window");

const CreatePost = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
  }>();

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      const { uri: thumbnailUri } =
        await VideoThumbnails.getThumbnailAsync(uri);
      setThumbnail(thumbnailUri);
    };

    if (type === "video") {
      void generateThumbnail();
    }
  }, [type, uri]);

  useEffect(() => {
    RNImage.getSize(uri, (width, height) => {
      setAspectRatio(width / height);
    });
  }, [uri]);

  return (
    <BaseScreenView>
      <Image
        source={{ uri: thumbnail ?? uri }}
        style={[styles.media, aspectRatio ? { aspectRatio } : {}]}
        contentFit="contain"
      />
    </BaseScreenView>
  );
};

const styles = StyleSheet.create({
  media: {
    width: windowWidth - 40, // to give some padding
    maxHeight: 250,
    borderRadius: 10,
  },
});

export default CreatePost;
