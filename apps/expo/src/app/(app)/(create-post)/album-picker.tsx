import React, { useEffect, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { ChevronRight } from "@tamagui/lucide-icons";
import { Stack, Text, XStack, YStack } from "tamagui";
import { Image } from "expo-image";

import { BaseScreenView } from "~/components/Views";

const AlbumPickerScreen = () => {
  const router = useRouter();

  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);

  useEffect(() => {
    const fetchAlbums = async () => {
      const albumList = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      // Filter out unwanted albums
      const filteredAlbums = albumList.filter(
        (album) =>
          !["Bursts", "Raw", "Recently Deleted", "Screenshots"].includes(
            album.title,
          ) && album.assetCount > 0,
      );

      // Move 'Recents' to the top
      filteredAlbums.sort((a, b) => {
        if (a.title === "Recents") return -1;
        if (b.title === "Recents") return 1;
        return 0;
      });

      // Fetch cover image for each album
      const albumsWithCover = await Promise.all(
        filteredAlbums.map(async (album) => {
          const assets = await MediaLibrary.getAssetsAsync({
            album: album.id,
            first: 1,
            mediaType: [
              MediaLibrary.MediaType.photo,
              MediaLibrary.MediaType.video,
            ],
          });
          return {
            ...album,
            coverPhoto: assets.assets[0]?.uri,
          };
        }),
      );

      setAlbums(albumsWithCover);
    };

    void fetchAlbums();
  }, []);

  const renderItem = ({
    item,
  }: {
    item: MediaLibrary.Album & { coverPhoto?: string };
  }) => (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingVertical="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
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
      <XStack alignItems="center">
        <Image
          source={item.coverPhoto ? { uri: item.coverPhoto } : undefined}
          recyclingKey={item.id}
          style={{
            width: 70,
            height: 70,
            borderRadius: 100,
            marginRight: 10,
          }}
        />
        <YStack>
          <Text fontSize="$5" fontWeight="600" color="$color">
            {item.title}
          </Text>
          <Text fontSize="$2" color="$colorSubtitle">
            {item.assetCount} items
          </Text>
        </YStack>
      </XStack>
      <ChevronRight />
    </XStack>
  );

  return (
    <BaseScreenView paddingTop={0} scrollable>
      <YStack>
        {albums.map((album) => (
          <Stack key={album.id}>{renderItem({ item: album })}</Stack>
        ))}
      </YStack>
    </BaseScreenView>
  );
};

export default AlbumPickerScreen;
