import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";

import { BaseScreenView } from "~/components/Views";

const CreatePost = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
  }>();

  const [thumbnail, setThumbnail] = useState<string | null>(null);

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

  return (
    <BaseScreenView>
      <Image source={{ uri: thumbnail ?? uri }} style={styles.media} />
    </BaseScreenView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
  },
  media: {
    flex: 1,
    maxWidth: 140,
    maxHeight: 200,
    borderRadius: 24,
  },
});

export default CreatePost;
