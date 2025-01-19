import React from "react";
import { Dimensions, FlatList } from "react-native";
import { getToken } from "tamagui";

import { HeaderTitle } from "~/components/ui/Headings";
import { UserCard } from "~/components/ui/UserCard";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";

const STALE_TIME = 60 * 5000;

const { width: screenWidth } = Dimensions.get("window");

const GridSuggestions = () => {
  const utils = api.useUtils();
  const { routeProfile } = useRouteProfile();

  const { data } = api.contacts.getRecommendationProfilesSelf.useQuery(
    undefined,
    {
      staleTime: STALE_TIME,
    },
  );

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.contacts.getRecommendationProfilesSelf.cancel();
      const prevData = utils.contacts.getRecommendationProfilesSelf.getData();
      if (!prevData) return { prevData: undefined };

      utils.contacts.getRecommendationProfilesSelf.setData(
        undefined,
        prevData.filter((item) => item.userId !== newData.userId),
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx?.prevData === undefined) return;
      void utils.contacts.getRecommendationProfilesSelf.invalidate();
    },
  });

  const handleProfilePress = (userId: string, username: string) => {
    routeProfile({ userId, username });
  };

  if (!data?.length) {
    return null;
  }

  const SCREEN_PADDING = getToken("$4", "space") as number;
  const GAP = getToken("$2", "space") as number;
  const TILE_WIDTH = (screenWidth - SCREEN_PADDING * 2 - GAP) / 2; // Account for screen padding and gap between tiles

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => (
        <UserCard
          userId={item.userId}
          username={item.username}
          profilePictureUrl={item.profilePictureUrl}
          width={TILE_WIDTH}
          index={index}
          onPress={() => handleProfilePress(item.userId, item.username)}
          actionButton={{
            label: "Follow",
            onPress: () =>
              void followMutation.mutateAsync({ userId: item.userId }),
          }}
        />
      )}
      numColumns={2}
      ListHeaderComponent={
        <HeaderTitle icon="sparkles">Suggested for You</HeaderTitle>
      }
      columnWrapperStyle={{ gap: getToken("$2", "space") as number }}
      contentContainerStyle={{ gap: getToken("$2", "space") as number }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
};

export default GridSuggestions;
