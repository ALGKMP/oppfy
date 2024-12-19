import React, { useCallback, useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { throttle } from "lodash";
import { getToken, H5, Spacer, Text, View, XStack, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { Skeleton } from "~/components/Skeletons";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import UserItem from "./UserItem";

interface PersonItem {
  userId: string;
  username: string;
  profilePictureUrl: string | null;
}

interface LoadingProps {
  loading: true;
}

interface LoadedProps<T extends PersonItem> {
  loading: false;
  data: T[];
  title?: string;
  emoji?: string;
  showMore?: boolean;
  uiStyle?: "default" | "suggestions";
  onTitlePress?: () => void;
  onItemPress: (item: T) => void;
  onShowMore?: () => void;
  renderExtraItem?: () => React.ReactElement;
}

type PeopleCarouselProps<T extends PersonItem> = LoadingProps | LoadedProps<T>;

function PeopleCarousel<T extends PersonItem>(props: PeopleCarouselProps<T>) {
  const throttledHandleShowMore = useRef(
    throttle(
      () => {
        if ("onShowMore" in props && props.onShowMore) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          props.onShowMore();
        }
      },
      300,
      { leading: true, trailing: false },
    ),
  ).current;

  useEffect(() => {
    return () => {
      throttledHandleShowMore.cancel();
    };
  }, [throttledHandleShowMore]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (props.loading) return;
      if (!props.showMore) return;

      const { contentSize, contentOffset, layoutMeasurement } =
        event.nativeEvent;
      const contentWidth = contentSize.width;
      const offsetX = contentOffset.x;
      const layoutWidth = layoutMeasurement.width;

      if (offsetX + layoutWidth >= contentWidth + 80) {
        throttledHandleShowMore();
      }
    },
    [props, throttledHandleShowMore],
  );

  if (props.loading) {
    return (
      <CardContainer paddingLeft={0} paddingRight={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          horizontal
          ListEmptyComponent={null}
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          renderItem={() => <Skeleton circular size={70} />}
          ItemSeparatorComponent={() => <Spacer size="$2.5" />}
          contentContainerStyle={{
            paddingHorizontal: getToken("$2", "space") as number,
          }}
        />
      </CardContainer>
    );
  }

  const {
    data,
    title,
    emoji,
    showMore = false,
    onTitlePress,
    onItemPress,
    renderExtraItem,
    uiStyle = "default",
  } = props;

  return (
    <CardContainer paddingHorizontal={0}>
      <YStack gap="$3">
        {title && (
          <TouchableOpacity onPress={onTitlePress} disabled={!onTitlePress}>
            <XStack>
              <H5 paddingLeft="$3">{title}</H5>
              {emoji && <Text fontSize="$3"> {emoji}</Text>}
            </XStack>
          </TouchableOpacity>
        )}

        <FlashList
          data={data}
          horizontal
          estimatedItemSize={uiStyle === "suggestions" ? 150 : 70}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item }) => <UserItem item={item} />}
          ListFooterComponent={
            <>
              {renderExtraItem?.()}
              {showMore && (
                <TouchableOpacity onPress={throttledHandleShowMore}>
                  <YStack width={70} gap="$2" alignItems="center">
                    <View
                      width={70}
                      height={70}
                      justifyContent="center"
                      alignItems="center"
                      borderRadius={35}
                      backgroundColor="$backgroundStrong"
                    >
                      <Text fontSize={24}>👀</Text>
                    </View>
                    <Text
                      theme="alt1"
                      fontSize="$2"
                      fontWeight="600"
                      textAlign="center"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      See more
                    </Text>
                  </YStack>
                </TouchableOpacity>
              )}
            </>
          }
          ItemSeparatorComponent={() => <Spacer size="$2.5" />}
          contentContainerStyle={{
            paddingHorizontal: getToken("$2.5", "space") as number,
          }}
          ListFooterComponentStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      </YStack>
    </CardContainer>
  );
}

export default PeopleCarousel;
