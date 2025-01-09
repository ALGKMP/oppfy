import React from "react";
import { Dimensions, FlatList } from "react-native";
import { Sparkles } from "@tamagui/lucide-icons";
import { getToken } from "tamagui";

import { YStack } from "~/components/ui";
import { HeaderTitle } from "~/components/ui/Headings";
import { UserCard } from "~/components/ui/UserCard";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

const STALE_TIME = 60 * 1000;

type RecommendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

const { width: screenWidth } = Dimensions.get("window");

const GridSuggestions = () => {
  const utils = api.useUtils();
  const { routeProfile } = useRouteProfile();

  const { data, isLoading } =
    api.contacts.getRecommendationProfilesSelf.useQuery(undefined, {
      staleTime: STALE_TIME,
    });

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

  if (!data?.length || isLoading) {
    return null;
  }

  const TILE_WIDTH = screenWidth / 2 - getToken("$3", "space") * 2; // Two tiles with gap in between

  return (
    <YStack>
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
                followMutation.mutateAsync({ userId: item.userId }),
              variant: "primary",
            }}
          />
        )}
        numColumns={2}
        ListHeaderComponent={
          <HeaderTitle icon={<Sparkles />} theme="alt1">
            Suggested for You
          </HeaderTitle>
        }
        columnWrapperStyle={{ gap: getToken("$3", "space") }}
        contentContainerStyle={{ gap: getToken("$3", "space") }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </YStack>
  );
};

export default GridSuggestions;
