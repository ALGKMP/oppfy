import { useEffect } from "react";
import { Text } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const MediaOfFriendsYouPosted = () => {
  const test = api.post.getPosts.useInfiniteQuery(
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    console.log(test.data?.pages.flatMap((page) => page.items));
  }, [test]);

  return (
    <BaseScreenView>
      <Text>Media of friends you posted</Text>
    </BaseScreenView>
  );
};

export default MediaOfFriendsYouPosted;
