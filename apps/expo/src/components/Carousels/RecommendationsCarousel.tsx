import React, { useCallback, useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { throttle } from "lodash";
import {
  Avatar,
  Button,
  getToken,
  ListItemTitle,
  SizableText,
  Spacer,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import { date } from "zod";

import { abbreviatedNumber } from "@oppfy/utils";

import CardContainer from "~/components/Containers/CardContainer";
import { Skeleton } from "~/components/Skeletons";
import { api, type RouterOutputs } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

// type FriendItems = RouterOutputs["friend"]["paginateFriendsSelf"]["items"];
type RecoemndationItems =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"];

/* interface FriendsData {
  friendCount: number;
  friendItems: FriendItems;
} */

interface LoadingProps {
  loading: true;
}

interface RecommendationsLoadingProps {
  loading: false;
  reccomendationsData: RecoemndationItems;
}

type RecommendationsCarouselProps = LoadingProps | RecommendationsLoadingProps;

const RecommendationsCarousel = (props: RecommendationsCarouselProps) => {
  const router = useRouter();

  /*   const showMore =
    !props.loading &&
    props.reccomendationsData.length < props.; */

  const handleProfileClicked = (profileId: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate({
      pathname: "/(profile)/profile/[profile-id]/",
      params: { profileId: String(profileId) },
    });
  };

/*   const handleShowMoreFriends = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/friend-list");
  };

  const throttledHandleAction = useRef(
    throttle(handleShowMoreFriends, 300, { leading: true, trailing: false }),
  ).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      //   if (!showMore) return;

      const { contentSize, contentOffset, layoutMeasurement } =
        event.nativeEvent;

      const contentWidth = contentSize.width;
      const offsetX = contentOffset.x;
      const layoutWidth = layoutMeasurement.width;

      // Check if within the threshold from the end
      if (offsetX + layoutWidth - 80 >= contentWidth) {
        throttledHandleAction();
      }
    },
    [showMore,  throttledHandleAction],
  );

  useEffect(() => throttledHandleAction.cancel(), [throttledHandleAction]); */

  const renderLoadingSkeletons = () => (
    <CardContainer>
      <XStack gap="$2">
        {PLACEHOLDER_DATA.map((item, index) => (
          <Skeleton key={index} circular size={70} />
        ))}
      </XStack>
    </CardContainer>
  );

  const renderSuggestions = (data: RecoemndationItems) => (
    <CardContainer backgroundColor={"$background"}>
      <YStack gap="$2">
        <FlashList
          data={data}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          // onScroll={handleScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleProfileClicked(item.profileId)}
            >
              <YStack gap="$1.5">
                <Avatar circular size="$6" bordered>
                  <Avatar.Image src={item.profilePictureUrl} />
                </Avatar>
                <Text fontWeight="600" textAlign="center">
                  {item.username}
                </Text>
              </YStack>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <Spacer size="$2" />}
          contentContainerStyle={{
            paddingHorizontal: getToken("$3", "space") as number,
          }}
          ListFooterComponentStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      </YStack>
    </CardContainer>
  );

  if (props.loading) {
    return renderLoadingSkeletons();
  }

  if (props.reccomendationsData.length === 0) {
    return null;
  }
  return renderSuggestions(props.reccomendationsData);
};

export default RecommendationsCarousel;
