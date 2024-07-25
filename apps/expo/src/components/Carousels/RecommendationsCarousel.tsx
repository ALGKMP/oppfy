import React, { useCallback, useEffect, useRef } from "react";
import { Share, TouchableOpacity } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { UserRound, UserRoundPlus } from "@tamagui/lucide-icons";
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

type RecoemndationItems =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"];

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

  const showMore = !props.loading && props.reccomendationsData.length > 10;

  const handleProfileClicked = (userId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate({
      pathname: "/(profile)/profile/[userId]/",
      params: { userId: userId },
    });
  };

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: "Join me on Oppfy!",
        // Add your app's download link or website here
        url: "https://oppfy.com",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleShowMoreRecs = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log("going in there");
    router.push("/(app)/(recomended)/recomended");
    // router.push("/(app)/(onboarding)/misc/recomendations");
    // router.push("/self-connections/friend-list");
  };

  const throttledHandleAction = useRef(
    throttle(handleShowMoreRecs, 300, { leading: true, trailing: false }),
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
        {PLACEHOLDER_DATA.map((item, index) => (
          <Skeleton key={index} circular size={70} />
        ))}
      </XStack>
    </CardContainer>
  );

  const renderSuggestions = (data: RecoemndationItems) => (
    <CardContainer
      backgroundColor={"$background"}
      borderRadius={0}
      paddingLeft={0}
    >
      <YStack gap="$2">
        <FlashList
          data={[...data, { last: true }]}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item, index }) =>
            // check type of item
            "last" in item ? (
              <TouchableOpacity onPress={handleInviteFriends}>
                <YStack gap="$1.5" alignItems="center">
                  <Avatar circular size="$6" bordered>
                    <Avatar.Fallback backgroundColor={"#F214FF"}>
                      <XStack
                        flex={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <UserRoundPlus
                          marginLeft={4}
                          bg={"$colorTransparent"}
                          color="white"
                        />
                      </XStack>
                    </Avatar.Fallback>
                  </Avatar>
                  <Text fontWeight="600" textAlign="center">
                    Invite
                  </Text>
                </YStack>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleProfileClicked(item.userId)}
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
            )
          }
          ListFooterComponent={
            showMore ? (
              <View
                marginRight={-100}
                justifyContent="center"
                alignItems="center"
              >
                <SizableText color="#F214FF" fontWeight="600">
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

  return renderSuggestions(props.reccomendationsData);
};

export default RecommendationsCarousel;
