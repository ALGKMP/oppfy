import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;

const MediaPickerScreen = () => {
  const router = useRouter();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        first: 100,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      setAssets(media.assets);
    };

    fetchAssets();
  }, []);

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        router.push({
          pathname: "/preview",
          params: {
            type: item.mediaType === "video" ? "video" : "photo",
            uri: item.uri,
            width: item.width,
            height: item.height,
          },
        });
      }}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      {item.mediaType === "video" && (
        <View style={styles.videoIconOverlay}>
          <Ionicons name="play-circle" size={24} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={assets}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.list}
    />
  );
};

export default MediaPickerScreen;

const styles = StyleSheet.create({
  list: {
    marginVertical: 10,
  },
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 1,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  videoIconOverlay: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },
});
