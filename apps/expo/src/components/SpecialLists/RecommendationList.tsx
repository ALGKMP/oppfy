import React, { useState } from "react";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import { FlashList } from "@shopify/flash-list";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { H5 } from "tamagui";

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
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const followUserMutation = api.follow.followUser.useMutation();

  const renderItem = ({ item }: { item: RecommendationItem }) => {
    const isFollowed = followedUsers.has(item.userId);
    const buttonProps = isFollowed
      ? {
          text: "Followed",
          icon: <UserRoundCheck size="$1" />,
        }
      : {
          text: "Follow",
          icon: <UserRoundPlus size="$1" />,
          backgroundColor: "#F214FF",
        };

    return (
      <VirtualizedListItem
        loading={props.loading}
        title={item.fullName ?? item.username}
        subtitle={item.fullName ? item.username : ""}
        button={{
          ...buttonProps,
          disabled: isFollowed,
          disabledStyle: { opacity: 0.5 },
          onPress: () => {
            if (!isFollowed) {
              followUserMutation.mutate({ userId: item.userId });
              setFollowedUsers((prev) => new Set(prev).add(item.userId));
            }
          },
        }}
        imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
        onPress={() => props.handleProfileClicked(item.userId, item.username)}
      />
    );
  };

  return (
    props.recommendationsData.length > 0 && (
      <CardContainer>
        <H5 theme="alt1">Suggestions 🔥</H5>
        <FlashList
          data={props.recommendationsData}
          estimatedItemSize={75}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          extraData={followedUsers}
        />
      </CardContainer>
    )
  );
};

export default RecommendationList;
