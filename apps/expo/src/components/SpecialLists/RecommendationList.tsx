import { FlashList } from "@shopify/flash-list";
import { Router } from "@trpc/server";
import { Button, Text, View, YStack } from "tamagui";

import { RouterOutputs } from "@oppfy/api";

import { api } from "~/utils/api";
import { VirtualizedListItem } from "../ListItems";

type RecommendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

interface RecommendationListProps {
  loading: boolean;
  recommendationsData: RecommendationItem[];
  handleProfileClicked: (userId: string, username: string) => void;
}

const RecommendationList = (props: RecommendationListProps) => {
  const followUserMutation = api.follow.followUser.useMutation();

  return (
    <View
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderRadius="$6"
      backgroundColor="$gray2"
    >
      <FlashList
        data={props.recommendationsData}
        estimatedItemSize={75}
        // onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          return (
            <VirtualizedListItem
              loading={false}
              title={item.fullName ?? item.username}
              subtitle={item.fullName ? item.username : ""}
              button={{
                // disabledStyle: { opacity: 0.5 },
                text: "Follow",
                onPress: () => {
                  void followUserMutation.mutateAsync({ userId: item.userId });
                },
              }}
              imageUrl={item.profilePictureUrl}
              onPress={() => {
                props.handleProfileClicked(item.userId, item.username);
              }}
            />
          );
        }}
      />
    </View>
  );
};

export default RecommendationList;
