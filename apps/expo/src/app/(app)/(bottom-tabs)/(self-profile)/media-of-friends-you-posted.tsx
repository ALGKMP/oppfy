import React, { useEffect, useMemo } from "react";
import { FlashList } from "@shopify/flash-list";
import { Image, Text, View } from "tamagui";
import { z } from "zod";

import { post } from "@oppfy/validators";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const MediaOfFriendsYouPosted = () => {
  const utils = api.useUtils();

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

  const renderItem = ({ item }: { item: z.infer<typeof post> | undefined}) => (
    <View flex={1} margin={5} aspectRatio={1}>
      <Text>Image</Text>
      <Image
        source={{ uri: item?.imageUrl }}
        width="100%"
        height="100%"
        borderRadius={10}
        style={{ flex: 1, borderRadius: 10 }}
      />
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
        onEndReached={() => {
          if (!myQuery.isFetchingNextPage && myQuery.hasNextPage) {
            myQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </BaseScreenView>
  );
};

export default MediaOfFriendsYouPosted;
