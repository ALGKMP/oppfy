import React, { useCallback, useLayoutEffect } from "react";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Video } from "@tamagui/lucide-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData, QueryFunctionContext } from "@tanstack/react-query";
import { getToken, Image } from "tamagui";

import { Stack } from "~/components/ui";

const MAX_VIDEO_DURATION = 60;
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;
const PAGE_SIZE = 50;

interface UseMediaAssetsProps {
  albumId: string;
}

interface MediaAssetsPage {
  items: MediaLibrary.Asset[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

type MediaAssetsQueryKey = ["mediaAssets", string];
type MediaAssetsInfiniteData = InfiniteData<MediaAssetsPage>;

const useMediaAssets = ({ albumId }: UseMediaAssetsProps) => {
  return useInfiniteQuery<
    MediaAssetsPage,
    Error,
    MediaAssetsInfiniteData,
    MediaAssetsQueryKey,
    string | null
  >({
    queryKey: ["mediaAssets", albumId],
    queryFn: async (
      context: QueryFunctionContext<MediaAssetsQueryKey, string | null>,
    ) => {
      const media = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        first: PAGE_SIZE,
        after: context.pageParam ?? undefined,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      // Filter out assets that are wider than tall and videos longer than 1 minute
      const filteredAssets = await Promise.all(
        media.assets.map(async (asset) => {
          if (asset.mediaType === "video") {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
            return (
              asset.height >= asset.width &&
              assetInfo.duration <= MAX_VIDEO_DURATION
            );
          }
          return asset.height >= asset.width;
        }),
      );

      return {
        items: media.assets.filter((_, index) => filteredAssets[index]),
        nextCursor: media.endCursor,
        hasNextPage: media.hasNextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });
};

const moveVideoToLocalStorage = async (uri: string) => {
  // Remove file:// prefix if present
  const cleanUri = uri.replace("file://", "");
  const filename = cleanUri.split("/").pop() ?? "video.mp4";
  const destination = `${FileSystem.documentDirectory}videos/${filename}`;

  // Ensure videos directory exists
  await FileSystem.makeDirectoryAsync(
    `${FileSystem.documentDirectory}videos/`,
    {
      intermediates: true,
    },
  ).catch(() => {});

  // Copy file
  await FileSystem.copyAsync({
    from: uri,
    to: destination,
  });

  return `file://${destination}`;
};

const MediaPickerScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { albumId, albumTitle } = useLocalSearchParams<{
    albumId: string;
    albumTitle: string;
  }>();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMediaAssets({ albumId });

  const assets = data?.pages.flatMap((page) => page.items) ?? [];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: albumTitle,
    });
  }, [navigation, albumTitle]);

  const renderItem = useCallback(
    ({ item }: { item: MediaLibrary.Asset }) => {
      return (
        <Stack
          width={ITEM_SIZE}
          height={ITEM_SIZE}
          margin={0.5}
          onPress={async () => {
            // Get full asset info with network download if needed
            const assetInfo = await MediaLibrary.getAssetInfoAsync(item, {
              shouldDownloadFromNetwork: true,
            });

            // For videos, we need to move to local storage and process
            if (item.mediaType === "video") {
              if (!assetInfo.localUri) {
                throw new Error("Could not get local URI for video");
              }

              // Move to local storage
              const localUri = await moveVideoToLocalStorage(
                assetInfo.localUri,
              );

              router.dismissTo("/(app)/(bottom-tabs)/(camera)");
              router.push({
                pathname: "/preview",
                params: {
                  uri: localUri,
                  type: assetInfo.mediaType,
                  height: assetInfo.height.toString(),
                  width: assetInfo.width.toString(),
                },
              });
            } else {
              // For images, continue with the normal flow
              router.dismissTo("/(app)/(bottom-tabs)/(camera)");
              router.navigate({
                pathname: "/preview",
                params: {
                  uri: assetInfo.uri,
                  type: assetInfo.mediaType,
                  height: assetInfo.height.toString(),
                  width: assetInfo.width.toString(),
                },
              });
            }
          }}
        >
          <Image
            source={{ uri: item.uri }}
            width={ITEM_SIZE}
            height={ITEM_SIZE}
            resizeMode="cover"
          />
          {item.mediaType === "video" && (
            <Stack position="absolute" top={5} left={5}>
              <Video size={16} color="#fff" />
            </Stack>
          )}
        </Stack>
      );
    },
    [router],
  );

  return (
    <FlashList
      data={assets}
      renderItem={renderItem}
      keyExtractor={(item) => item.uri}
      numColumns={NUM_COLUMNS}
      estimatedItemSize={ITEM_SIZE}
      onEndReached={() => {
        if (!hasNextPage || isFetchingNextPage) return;
        void fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{
        paddingBottom: insets.bottom,
        paddingTop: getToken("$3", "space") as number,
      }}
    />
  );
};

export default MediaPickerScreen;
