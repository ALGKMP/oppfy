import React, { useEffect, useMemo } from "react";
import { Touchable, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Text, View } from "tamagui";
import type { z } from "zod";

import type { post } from "@oppfy/validators";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const MediaOfFriendsYouPosted = () => {
  const utils = api.useUtils();
  const router = useRouter();

  const myQuery = api.post.paginatePostsByUserSelf.useInfiniteQuery(
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    console.log(
      "MEDIA OF FRIENDS THEY POSTED FILE:",
      myQuery.data?.pages[0]?.items,
    );
  });

  const mediaItems = useMemo(() => {
    return myQuery.data?.pages.flatMap((page) => page.items) || [];
  }, [myQuery.data]);

  const renderItem = ({ item }: { item: z.infer<typeof post> | undefined }) => (
    <View flex={1} margin={5} aspectRatio={1}>
      <TouchableOpacity
        onPress={() =>
          router.push(
            "/(app)/(bottom-tabs)/(self-profile)/media-of-friends/preview",
          )
        }
      >
        <Animated.Image
          // source={{ uri: item?.imageUrl }}
          source={{
            uri: "https://media.discordapp.net/attachments/923957630878220298/1244685812373782679/IMG_4341.png?ex=6656037e&is=6654b1fe&hm=5976b732ca6e8f3233d092293fbc9beeebf771947a01f800dd4f3f8902e12d7f&=&format=webp&quality=lossless&width=786&height=676",
          }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 10,
          }}
          sharedTransitionTag={"test"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <BaseScreenView>
      <Text>Media of friends you posted</Text>
      <FlashList
        data={mediaItems}
        renderItem={renderItem}
        numColumns={2}
        estimatedItemSize={200} // Adjust based on your image size
        onEndReached={async () => {
          if (!myQuery.isFetchingNextPage && myQuery.hasNextPage) {
            await myQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </BaseScreenView>
  );
};

export default MediaOfFriendsYouPosted;
