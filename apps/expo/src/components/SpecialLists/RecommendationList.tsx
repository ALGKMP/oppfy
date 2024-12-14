import React from "react";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { H5, YStack } from "tamagui";

import type { RouterOutputs } from "@oppfy/api";

import { api } from "~/utils/api";
import CardContainer from "../Containers/CardContainer";
import { VirtualizedListItem } from "../ListItems";

type RecommendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][number];

interface RecommendationListProps {
  loading: boolean;
  recommendationsData: RecommendationItem[] | undefined;
  handleProfileClicked: (userId: string, username: string) => void;
}

const RecommendationList = ({
  loading,
  recommendationsData,
  handleProfileClicked,
}: RecommendationListProps) => {
  const utils = api.useUtils();

  const followUserMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.contacts.getRecommendationProfilesSelf.cancel();

      // Get the current data from the queryCache
      const prevData = utils.contacts.getRecommendationProfilesSelf.getData();

      // Optimistically update to the new value
      if (prevData) {
        utils.contacts.getRecommendationProfilesSelf.setData(
          undefined,
          prevData.map((item) =>
            item.userId === newData.userId
              ? {
                  ...item,
                  relationshipStatus:
                    item.privacy === "private" ? "requested" : "following",
                }
              : item,
          ),
        );
      }

      // Return a context object with the previous data
      return { prevData };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.prevData) {
        utils.contacts.getRecommendationProfilesSelf.setData(
          undefined,
          context.prevData,
        );
      }
    },
  });

  const handleFollowToggle = (userId: string, currentStatus: string) => {
    if (currentStatus !== "requested" && currentStatus !== "following") {
      followUserMutation.mutate({ userId });
    }
  };

  const renderItem = ({ item }: { item: RecommendationItem }) => {
    let buttonText;
    let buttonIcon;
    let isDisabled = false;

    switch (item.relationshipStatus) {
      case "following":
        buttonText = "Following";
        buttonIcon = <UserRoundCheck size="$1" />;
        isDisabled = true;
        break;
      case "requested":
        buttonText = "Requested";
        buttonIcon = <UserRoundCheck size="$1" />;
        isDisabled = true;
        break;
      default:
        buttonText = "Follow";
        buttonIcon = <UserRoundPlus size="$1" />;
    }

    return (
      <VirtualizedListItem
        loading={loading}
        title={item.username}
        subtitle={item.name}
        imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
        onPress={() => handleProfileClicked(item.userId, item.username)}
        button={{
          text: buttonText,
          icon: buttonIcon,
          onPress: () =>
            handleFollowToggle(item.userId, item.relationshipStatus),
          disabled: isDisabled,
          disabledStyle: { opacity: 0.5 },
        }}
      />
    );
  };

  if (recommendationsData === undefined || recommendationsData.length === 0) {
    return null;
  }

  return (
    <CardContainer>
      <YStack gap="$2">
        <H5 theme="alt1">Suggestions</H5>
        <FlashList
          data={recommendationsData}
          estimatedItemSize={75}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId}
        />
      </YStack>
    </CardContainer>
  );
};

export default RecommendationList;
