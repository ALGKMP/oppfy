import React, { useState } from "react";
import { Dimensions, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getToken } from "tamagui";

import { UserCard } from "~/components/ui/UserCard";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");

const Recommendations = () => {
  const utils = api.useUtils();
  const insets = useSafeAreaInsets();
  const { routeProfile } = useRouteProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, refetch, isLoading } =
    api.contacts.profileRecommendations.useQuery(undefined, {
      staleTime: 60 * 5000,
    });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.contacts.profileRecommendations.cancel();
      const prevData = utils.contacts.profileRecommendations.getData();
      if (!prevData) return { prevData: undefined };

      utils.contacts.profileRecommendations.setData(
        undefined,
        prevData.map((item) =>
          item.userId === newData.recipientUserId
            ? {
                ...item,
                followStatus:
                  item.privacy === "public" ? "FOLLOWING" : "REQUESTED",
              }
            : item,
        ),
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx?.prevData === undefined) return;
      utils.contacts.profileRecommendations.setData(undefined, ctx.prevData);
    },
  });

  const SCREEN_PADDING = getToken("$4", "space") as number;
  const GAP = getToken("$2", "space") as number;
  const TILE_WIDTH = (screenWidth - SCREEN_PADDING * 2 - GAP) / 2;

  if (isLoading && !isRefreshing) {
    return (
      <FlatList
        data={Array(10).fill(0)}
        renderItem={() => <UserCard.Skeleton width={TILE_WIDTH} />}
        numColumns={2}
        columnWrapperStyle={{ gap: getToken("$2", "space") as number }}
        contentContainerStyle={{
          padding: getToken("$4", "space") as number,
          paddingBottom: insets.bottom,
          gap: getToken("$2", "space") as number,
        }}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  if (!data?.length) {
    return null;
  }

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
          onPress={() =>
            routeProfile(item.userId, {
              name: item.name ?? "",
              username: item.username,
              profilePictureUrl: item.profilePictureUrl,
            })
          }
          actionButton={{
            label:
              item.followStatus === "FOLLOWING"
                ? "Following"
                : item.followStatus === "REQUESTED"
                  ? "Requested"
                  : "Follow",
            onPress: () =>
              void followMutation.mutateAsync({
                recipientUserId: item.userId,
              }),
            variant:
              item.followStatus === "FOLLOWING" ||
              item.followStatus === "REQUESTED"
                ? "outlined"
                : "primary",
          }}
        />
      )}
      numColumns={2}
      columnWrapperStyle={{ gap: getToken("$2", "space") as number }}
      contentContainerStyle={{
        padding: getToken("$4", "space") as number,
        paddingBottom: insets.bottom,
        gap: getToken("$2", "space") as number,
      }}
      showsVerticalScrollIndicator={false}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    />
  );
};

export default Recommendations;
