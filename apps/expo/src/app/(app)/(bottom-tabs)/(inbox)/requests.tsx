import React from "react";
import { Text, View } from "tamagui";

import { api } from "~/utils/api";

const Requests = () => {
  const { data: followRequestsData } =
    api.request.paginateFollowRequests.useInfiniteQuery(
      {
        pageSize: 5,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const { data: friendRequestsData } =
    api.request.paginateFriendRequests.useInfiniteQuery(
      {
        pageSize: 5,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$4">
      <Text>Requests</Text>
    </View>
  );
};

export default Requests;
