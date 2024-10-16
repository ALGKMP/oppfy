import React, { useEffect, useLayoutEffect, useState } from "react";
import { Dimensions } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Video } from "@tamagui/lucide-icons";
import { Image, Stack } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const NUM_COLUMNS = 4;
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
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => {
    return (
      <Stack
        width={ITEM_SIZE}
        height={ITEM_SIZE}
        margin={0.5}
        onPress={() => {
          router.push({
            pathname: "/preview",
            params: {
              uri: item.uri,
              type: item.mediaType,
              height: item.height.toString(),
              width: item.width.toString(),
            },
          });
        }}
      >
        <Image
          source={{ uri: item.uri }}
          width="100%"
          height="100%"
          resizeMode="cover"
        />
        {item.mediaType === "video" && (
          <Stack position="absolute" top={5} left={5}>
            <Video size={16} color="#fff" />
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <BaseScreenView padding={0}>
      <FlashList
        data={assets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        estimatedItemSize={ITEM_SIZE}
        onEndReached={() => {
          if (!hasNextPage || isLoading) return;
          void fetchAssets();
        }}
        onEndReachedThreshold={0.5}
      />
    </BaseScreenView>
  );
};

export default MediaPickerScreen;
