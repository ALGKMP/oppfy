import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  PermissionsAndroid,
  Platform,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const AlbumPickerScreen = () => {
  const router = useRouter();
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionsGranted(status === "granted");
    };

    getPermissions();
  }, []);

  useEffect(() => {
    if (!permissionsGranted) return;

    const fetchAlbums = async () => {
      const albumList = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      // Filter out unwanted albums
      const filteredAlbums = albumList.filter(
        (album) =>
          !["Bursts", "Raw", "Recently Deleted", "Screenshots"].includes(album.title) &&
          album.assetCount > 0
      );

      // Fetch cover image for each album
      const albumsWithCover = await Promise.all(
        filteredAlbums.map(async (album) => {
          const assets = await MediaLibrary.getAssetsAsync({
            album: album.id,
            first: 1,
            mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          });
          return {
            ...album,
            coverPhoto: assets.assets[0]?.uri,
          };
        })
      );

      setAlbums(albumsWithCover);
    };

    fetchAlbums();
  }, [permissionsGranted]);

  const renderItem = ({
    item,
  }: {
    item: MediaLibrary.Album & { coverPhoto?: string };
  }) => (
    <TouchableOpacity
      style={styles.albumItem}
      onPress={() => {
        router.push({
          pathname: "/media-picker",
          params: {
            albumId: item.id,
            albumTitle: item.title,
          },
        });
      }}
    >
      <View style={styles.albumInfo}>
        <View style={styles.albumCoverWrapper}>
          <Image
            source={
              item.coverPhoto
                ? { uri: item.coverPhoto }
                : undefined
            }
            style={styles.albumCover}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.albumCoverOverlay}
          />
          <Text style={styles.albumCount}>{item.assetCount}</Text>
        </View>
        <Text style={styles.albumTitle}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Albums</Text>
      </View>
      {/* Album List */}
      <FlatList
        data={albums}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default AlbumPickerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 60,
    justifyContent: "center",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  list: {
    padding: 10,
  },
  albumItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
    justifyContent: "space-between",
  },
  albumInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  albumCoverWrapper: {
    position: "relative",
    marginRight: 15,
  },
  albumCover: {
    width: 70,
    height: 70,
    borderRadius: 5,
  },
  albumCoverOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderRadius: 5,
  },
  albumCount: {
    position: "absolute",
    bottom: 5,
    right: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  albumTitle: {
    fontSize: 17,
    fontWeight: "500",
  },
});
