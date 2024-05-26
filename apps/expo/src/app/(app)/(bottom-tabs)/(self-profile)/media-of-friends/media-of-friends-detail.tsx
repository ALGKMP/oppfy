import React, { useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { api } from '~/utils/api';
import { StackNavigationProp } from '@react-navigation/stack';

const MediaOfFriendsDetails = () => {
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

export default MediaOfFriendsDetails;
