import React, { useCallback, useState } from "react";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import { FlashList } from "@shopify/flash-list";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { H5, Text, View } from "tamagui";

import { RouterOutputs } from "@oppfy/api";

import { api } from "~/utils/api";
import CardContainer from "../Containers/CardContainer";
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
        icon: isFollowing ? (
          <UserRoundCheck size="$1" />
        ) : (
          <UserRoundPlus size="$1" />
        ),
        backgroundColor: isFollowing ? "#F214FF" : "#F214FF",
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
          imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
          onPress={() => {
            props.handleProfileClicked(item.userId, item.username);
          }}
        />
      );
    },
    [followingState, props, handleFollowToggle],
  );

  return (
    props.recommendationsData.length > 0 && (
      <CardContainer>
        <H5 theme="alt1">Suggested for you</H5>
        <FlashList
          data={props.recommendationsData}
          estimatedItemSize={75}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          extraData={followingState} // Force re-render when followingState changes
        />
      </CardContainer>
    )
  );
};

export default RecommendationList;
