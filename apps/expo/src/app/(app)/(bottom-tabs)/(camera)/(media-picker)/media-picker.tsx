import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Dimensions } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Video } from "@tamagui/lucide-icons";
import { Stack } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;

const MediaPickerScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();

  const { albumId, albumTitle } = useLocalSearchParams<{
    albumId: string;
    albumTitle: string;
  }>();

  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: albumTitle,
    });
  }, [navigation, albumTitle]);

  const fetchAssets = async () => {
    if (!hasNextPage || isLoading) return;
    setIsLoading(true);

    const media = await MediaLibrary.getAssetsAsync({
      album: albumId,
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
    void fetchAssets();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MediaLibrary.Asset }) => {
      return (
        <Stack
          width={ITEM_SIZE}
          height={ITEM_SIZE}
          margin={0.5}
          onPress={async () => {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(item);

            router.dismiss();
            router.dismiss();

            router.push({
              pathname:
                item.mediaType === "video" ? "/video-editor" : "/preview",
              params: {
                uri: assetInfo.localUri,
                type: assetInfo.mediaType,
                height: assetInfo.height.toString(),
                width: assetInfo.width.toString(),
              },
            });
          }}
        >
          <Image
            source={{ uri: item.uri }}
            recyclingKey={item.uri}
            style={{
              width: "100%",
              height: "100%",
            }}
            contentFit="cover"
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
        if (!hasNextPage || isLoading) return;
        void fetchAssets();
      }}
      onEndReachedThreshold={0.5}
    />
  );
};

export default MediaPickerScreen;
