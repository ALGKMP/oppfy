import React, { useCallback, useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter, useSegments } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { throttle } from "lodash";
import {
  Avatar,
  getToken,
  H4,
  H5,
  H6,
  ListItemTitle,
  SizableText,
  Spacer,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { Skeleton } from "~/components/Skeletons";
import type { RouterOutputs } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

type FriendItem = RouterOutputs["friend"]["paginateFriendsSelf"]["items"][0];
type RecemmendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

interface FriendsData {
  friendCount: number;
  friendItems: FriendItem[];
}

interface LoadingProps {
  loading: true;
}

interface FriendsLoadedProps {
  loading: false;
  friendsData: FriendsData;
  reccomendationsData: RecemmendationItem[];
}

type FriendsCarouselProps = LoadingProps | FriendsLoadedProps;

const FriendsCarousel = (props: FriendsCarouselProps) => {
  const router = useRouter();
  const segments = useSegments();
  const currentSegment = segments[segments.length - 3];

  const showMore =
    !props.loading &&
    props.friendsData.friendItems.length < props.friendsData.friendCount;

  const handleSuggestionsProfileClicked = ({
    userId,
    username,
  }: RecemmendationItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: `${currentSegment}/profile/[userId]/`,
      params: { userId, username },
    });
  };

  const handleFriendProfileClicked = ({ userId, username }: FriendItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: `${currentSegment}/profile/[userId]/`,
      params: { userId, username },
    });
  };

  const handleShowMoreFriends = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/friend-list");
  };

  const throttledHandleAction = useRef(
    throttle(handleShowMoreFriends, 300, { leading: true, trailing: false }),
  ).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!showMore) return;

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
    [showMore, throttledHandleAction],
  );

  useEffect(() => throttledHandleAction.cancel(), [throttledHandleAction]);

  const renderLoadingSkeletons = () => (
    <CardContainer>
      <XStack gap="$2">
        {PLACEHOLDER_DATA.map((_, index) => (
          <Skeleton key={index} circular size={70} />
        ))}
      </XStack>
    </CardContainer>
  );

  const renderSuggestions = (data: RecemmendationItem[]) => (
    <CardContainer paddingLeft={0} margin={1}>
      <YStack gap="$2">
        <H5 paddingLeft="$3" theme="alt1">
          Discover People🔥
        </H5>

        <FlashList
          data={data}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSuggestionsProfileClicked(item)}
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
          ListFooterComponent={
            showMore ? (
              <View
                marginRight={-100}
                justifyContent="center"
                alignItems="center"
              >
                <SizableText color="$blue7" fontWeight="600">
                  See more
                </SizableText>
              </View>
            ) : null
          }
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

  const renderFriendList = (data: FriendsData) => (
    <CardContainer paddingHorizontal={0}>
      <YStack gap="$2">
        <TouchableOpacity onPress={handleShowMoreFriends}>
          <H5 paddingLeft="$3" theme="alt1">
            Friends🔥
          </H5>
        </TouchableOpacity>

        <FlashList
          data={data.friendItems}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleFriendProfileClicked(item)}>
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
          ListFooterComponent={
            showMore ? (
              <View
                marginRight={-100}
                justifyContent="center"
                alignItems="center"
              >
                <SizableText color="$blue7" fontWeight="600">
                  See more
                </SizableText>
              </View>
            ) : null
          }
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

  if (props.friendsData.friendCount === 0) {
    if (props.reccomendationsData.length === 0) {
      return null;
    }
    return renderSuggestions(props.reccomendationsData);
  }

  return renderFriendList(props.friendsData);
};

export default FriendsCarousel;
