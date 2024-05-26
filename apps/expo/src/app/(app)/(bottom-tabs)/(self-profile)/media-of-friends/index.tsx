import React, { useEffect, useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Image, Text, View } from 'tamagui';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { z } from 'zod';
import { post } from '@oppfy/validators';
import { useNavigation } from '@react-navigation/native';
import { SharedElement } from 'react-navigation-shared-element';
import { BaseScreenView } from '~/components/Views';
import { api } from '~/utils/api';
import { StackNavigationProp } from '@react-navigation/stack';

import { ParamListBase } from '@react-navigation/native';

export type MediaOfFriendsParamList = {
  'media-of-friends': undefined;
  'media-of-friends-detail': {
    item: {
      createdAt: Date;
      caption: string | null;
      postId: number;
      recipientId: string;
      authorId: string;
      authorUsername: string;
      authorProfilePicture: string;
      recipientUsername: string;
      recipientProfilePicture: string;
      imageUrl: string;
      commentsCount: number;
      likesCount: number;
    };
  };
};

const MediaOfFriends = () => {
  const utils = api.useUtils();
  const navigation = useNavigation<StackNavigationProp<MediaOfFriendsParamList>>();

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
      'MEDIA OF FRIENDS THEY POSTED FILE:',
      myQuery.data?.pages[0]?.items,
    );
  });

  const mediaItems = useMemo(() => {
    return myQuery.data?.pages.flatMap((page) => page.items) || [];
  }, [myQuery.data]);

  const renderItem = ({ item }: { item: z.infer<typeof post> | undefined }) => (
    <View flex={1} margin={5} aspectRatio={1}>
      <TouchableOpacity
        onPress={() => {
          if (item) {
            navigation.navigate('media-of-friends-detail', { item });
          }
        }}
      >
        <SharedElement id={`item.${item?.postId}.image`}>
          <Image
            source={{ uri: item?.imageUrl }}
            width="100%"
            height="100%"
            borderRadius={10}
            style={{ flex: 1, borderRadius: 10 }}
          />
        </SharedElement>
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

export default MediaOfFriends;
