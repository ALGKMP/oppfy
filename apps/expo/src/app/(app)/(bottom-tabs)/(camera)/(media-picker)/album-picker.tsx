import React, { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, Image as ImageIcon } from "@tamagui/lucide-icons";
import { getToken, Image, Text, XStack, YStack } from "tamagui";

import { EmptyPlaceholder } from "~/components/ui/EmptyPlaceholder";
import { useFlashListSize } from "~/hooks/useFlashListSize";

const EXCLUDED_ALBUMS = ["Bursts", "Raw", "Recently Deleted", "Screenshots"];

type AlbumWithCover = MediaLibrary.Album & {
  coverPhoto?: string;
};

const AlbumPickerScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Use the reusable hook for FlashList size estimation
  const { estimatedListSize } = useFlashListSize({
    estimatedItemCount: 15,
    averageItemHeight: 80,
    headerHeight: 0, // No header component
    sectionHeaderHeight: 0, // No section headers
    sectionHeaderCount: 0,
    extraBottomPadding: 20,
  });

  const [albums, setAlbums] = useState<AlbumWithCover[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches albums from device, filters them, and assigns cover photos.
   */
  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const allAlbums = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      // Filter out unwanted albums and only keep those with assets.
      const filtered = allAlbums.filter(
        (album) =>
          !EXCLUDED_ALBUMS.includes(album.title) && album.assetCount > 0,
      );

      // Move "Recents" to the top, if it exists.
      filtered.sort((a, b) => {
        if (a.title === "Recents") return -1;
        if (b.title === "Recents") return 1;
        return 0;
      });

      // Fetch a cover photo for each album.
      const withCover = await Promise.all(
        filtered.map(async (album) => {
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

      setAlbums(withCover);
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load albums on component mount.
   */
  useEffect(() => {
    void fetchAlbums();
  }, [fetchAlbums]);

  /**
   * Renders each album item for the FlashList.
   */
  const renderAlbumItem = useCallback(
    ({ item, index }: { item: AlbumWithCover; index: number }) => {
      const { id, title, coverPhoto, assetCount } = item;

      const handlePress = () => {
        router.push({
          pathname: "/(app)/(bottom-tabs)/(camera)/(media-picker)/media-picker",
          params: {
            albumId: id,
            albumTitle: title,
          },
        });
      };

      return (
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingTop={index === 0 ? 0 : "$3"}
          paddingBottom={index === albums.length - 1 ? 0 : "$3"}
          borderBottomWidth={index < albums.length - 1 ? 1 : 0}
          borderBottomColor="$borderColor"
          onPress={handlePress}
        >
          <XStack alignItems="center">
            <Image
              source={coverPhoto ? { uri: coverPhoto } : undefined}
              width={80}
              height={80}
              borderRadius="$2"
              marginRight="$3"
              backgroundColor="$gray5"
              resizeMode="cover"
            />
            <YStack>
              <Text fontSize="$5" fontWeight="600">
                {title}
              </Text>
              <Text fontSize="$2" color="$colorSubtitle">
                {assetCount} items
              </Text>
            </YStack>
          </XStack>
          <ChevronRight />
        </XStack>
      );
    },
    [router, albums],
  );

  /**
   * Unique key extractor for each album.
   */
  const keyExtractor = useCallback((album: AlbumWithCover) => album.id, []);

  const ListEmptyComponent = useCallback(() => {
    if (loading) return null;

    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        paddingTop="$10"
      >
        <EmptyPlaceholder
          icon={<ImageIcon size="$10" />}
          title="No Albums Found"
          subtitle="There are no photo albums available on your device."
        />
      </YStack>
    );
  }, [loading]);

  return (
    <FlashList
      data={albums}
      keyExtractor={keyExtractor}
      renderItem={renderAlbumItem}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={80}
      estimatedListSize={estimatedListSize}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{
        paddingBottom: insets.bottom,
        paddingHorizontal: getToken("$4", "space") as number,
      }}
    />
  );
};

export default AlbumPickerScreen;
