import React, { useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { api } from '~/utils/api';
import { StackNavigationProp } from '@react-navigation/stack';

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

  return (
    <>  </>
  );
};

export default MediaOfFriends;
