import { Router } from "@trpc/server";
import { Button, Text, YStack } from "tamagui";

import { RouterOutputs } from "@oppfy/api";

import { VirtualizedListItem } from "../ListItems";

type RecommendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

interface RecommendationListProps {
  loading: boolean;
  recommendationsData: RecommendationItem[];
  handleProfileClicked: (userId: string, username: string) => void;
}

const RecommendationList = (props: RecommendationListProps) => {
  return (
    <YStack>
      <Text fontWeight="bold" fontSize={16} padding={10}>
        Suggested for you
      </Text>
      {props.recommendationsData.map((recommendation, index) => (
        <VirtualizedListItem
          button={<Button color={"#F214FF"}>Follow</Button>}
          onPress={() =>
            props.handleProfileClicked(
              recommendation.userId,
              recommendation.username,
            )
          }
          key={index}
          imageUrl={recommendation.profilePictureUrl}
          loading={props.loading}
          title={recommendation.fullName ?? recommendation.username}
          subtitle={recommendation.fullName ? recommendation.username : ""}
        />
      ))}
    </YStack>
  );
};

export default RecommendationList;
