import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;

const MediaPickerScreen = () => {
  const router = useRouter();
  const { albumId, albumTitle } = useLocalSearchParams();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const fetchAssets = async () => {
    if (!hasNextPage || isLoading) return;
    setIsLoading(true);

    const media = await MediaLibrary.getAssetsAsync({
      album: albumId as string,
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      first: 50,
      after: endCursor ?? undefined,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });

    setAssets((prevAssets) => [...prevAssets, ...media.assets]);
    setEndCursor(media.endCursor);
    setHasNextPage(media.hasNextPage);
    setIsLoading(false);
  };

  useEffect(() => {
    setAssets([]);
    setEndCursor(null);
    setHasNextPage(true);
    fetchAssets();
  }, [albumId]);

  const toggleSelectAsset = (id: string) => {
    setSelectedAssets((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((assetId) => assetId !== id)
        : [...prevSelected, id]
    );
  };

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = selectedAssets.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => toggleSelectAsset(item.id)}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        {item.mediaType === "video" && (
          <View style={styles.videoIconOverlay}>
            <Ionicons name="videocam" size={16} color="#fff" />
          </View>
        )}
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <Ionicons name="checkmark-circle" size={24} color="#0f9d58" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleEndReached = () => {
    if (!hasNextPage || isLoading) return;
    fetchAssets();
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#888" />
      </View>
    );
  };

  const handleNext = () => {
    // Handle the next action with selected assets
    const selectedMedia = assets.filter((asset) =>
      selectedAssets.includes(asset.id)
    );

    // Navigate to preview or processing screen
    router.push({
      pathname: "/preview",
      params: {
        selectedMedia: JSON.stringify(selectedMedia),
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Header with Album Title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{albumTitle}</Text>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={selectedAssets.length === 0}
        >
          <Text
            style={[
              styles.nextButtonText,
              { color: selectedAssets.length > 0 ? "#0f9d58" : "#ccc" },
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media Grid */}
      <FlatList
        data={assets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.list}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

export default MediaPickerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  nextButton: {
    padding: 5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    marginVertical: 5,
  },
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 0.5,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  videoIconOverlay: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 2,
    borderRadius: 3,
  },
  selectedOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  loader: {
    paddingVertical: 20,
  },
});
