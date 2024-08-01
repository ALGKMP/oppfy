import React, { useCallback, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { Text, View } from "tamagui";

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
  const [followingState, setFollowingState] = useState<Record<string, boolean>>(
    {},
  );

  const followUserMutation = api.follow.followUser.useMutation();
  const unfollowUserMutation = api.follow.unfollowUser.useMutation();

  const handleFollowToggle = useCallback(
    async (userId: string) => {
      const isCurrentlyFollowing = followingState[userId];
      try {
        if (isCurrentlyFollowing) {
          await unfollowUserMutation.mutateAsync({ userId });
        } else {
          await followUserMutation.mutateAsync({ userId });
        }
        setFollowingState((prev) => ({
          ...prev,
          [userId]: !isCurrentlyFollowing,
        }));
      } catch (error) {
        console.error("Error toggling follow state:", error);
        // Handle error (e.g., show a toast message)
      }
    },
    [followingState, followUserMutation, unfollowUserMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: RecommendationItem }) => {
      const isFollowing = followingState[item.userId] || false;
      const buttonProps = {
        text: isFollowing ? "Following" : "Follow",
        icon: isFollowing ? UserRoundCheck : UserRoundPlus,
      };

      return (
        <VirtualizedListItem
          key={`${item.userId}-${isFollowing}`} // Force re-render when follow state changes
          loading={props.loading}
          title={item.fullName ?? item.username}
          subtitle={item.fullName ? item.username : ""}
          button={{
            ...buttonProps,
            onPress: () => void handleFollowToggle(item.userId),
          }}
          imageUrl={item.profilePictureUrl}
          onPress={() => {
            props.handleProfileClicked(item.userId, item.username);
          }}
        />
      );
    },
    [
      followingState,
      props.loading,
      handleFollowToggle,
      props.handleProfileClicked,
    ],
  );

  return (
    props.recommendationsData.length > 0 && (
      <View>
        <Text fontSize="$5" fontWeight="bold" marginBottom="$2" marginLeft="$3">
          Suggested for you
        </Text>
        <View
          paddingVertical="$2"
          paddingHorizontal="$3"
          borderRadius="$6"
          backgroundColor="$gray2"
        >
          <FlashList
            data={props.recommendationsData}
            estimatedItemSize={75}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            extraData={followingState} // Force re-render when followingState changes
          />
        </View>
      </View>
    )
  );
};

export default RecommendationList;
