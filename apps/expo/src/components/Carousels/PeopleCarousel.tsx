import React, { useCallback, useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image } from "expo-image";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import { FlashList } from "@shopify/flash-list";
import { throttle } from "lodash";
import {
  Avatar,
  getToken,
  H5,
  SizableText,
  Spacer,
  Text,
  View,
  YStack,
} from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { Skeleton } from "~/components/Skeletons";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

interface PersonItem {
  userId: string;
  username: string;
  profilePictureUrl: string | null;
}

interface PeopleCarouselProps<T extends PersonItem> {
  loading: boolean;
  data: T[];
  title?: string;
  showMore?: boolean;
  onItemPress: (item: T) => void;
  onShowMore: () => void;
  renderExtraItem?: () => React.ReactElement; // Change from React.ReactNode to React.ReactElement
}

const ListFooter: React.FC<{ showMore: boolean }> = ({ showMore }) => {
  if (!showMore) return null;
  return (
    <View marginRight={-100} justifyContent="center" alignItems="center">
      <SizableText color="$blue7" fontWeight="600">
        See more
      </SizableText>
    </View>
  );
};

function PeopleCarousel<T extends PersonItem>({
  loading,
  data,
  title,
  showMore = false,
  onItemPress,
  onShowMore,
  renderExtraItem,
}: PeopleCarouselProps<T>) {
  const throttledHandleShowMore = useRef(
    throttle(onShowMore, 300, { leading: true, trailing: false }),
  ).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!showMore) return;

      const { contentSize, contentOffset, layoutMeasurement } =
        event.nativeEvent;
      const contentWidth = contentSize.width;
      const offsetX = contentOffset.x;
      const layoutWidth = layoutMeasurement.width;

      if (offsetX + layoutWidth - 80 >= contentWidth) {
        throttledHandleShowMore();
      }
    },
    [showMore, throttledHandleShowMore],
  );

  useEffect(() => throttledHandleShowMore.cancel(), [throttledHandleShowMore]);

  if (loading) {
    return (
      <CardContainer
        backgroundColor={"$background"}
        borderRadius={0}
        paddingLeft={0}
        paddingRight={0}
      >
        <YStack gap="$2">
          {title && (
            <Text paddingLeft="$3" fontWeight="600">
              {title}
            </Text>
          )}
          <FlashList
            data={PLACEHOLDER_DATA}
            horizontal
            estimatedItemSize={70}
            showsHorizontalScrollIndicator={false}
            renderItem={() => <Skeleton circular size={70} />}
            ItemSeparatorComponent={() => <Spacer size="$2" />}
            contentContainerStyle={{
              paddingHorizontal: getToken("$3", "space") as number,
            }}
          />
        </YStack>
      </CardContainer>
    );
  }

  return (
    <CardContainer paddingHorizontal={0}>
      <YStack gap="$2">
        {title && (
          <TouchableOpacity onPress={onShowMore}>
            <H5 paddingLeft="$3" theme="alt1">
              {title}
            </H5>
          </TouchableOpacity>
        )}

        <FlashList
          data={data}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onItemPress(item)}>
              <YStack gap="$1.5">
                <Image
                  source={item.profilePictureUrl ?? DefaultProfilePicture}
                  style={{ width: 70, height: 70, borderRadius: 35 }}
                />
                <Text fontWeight="600" textAlign="center">
                  {item.username}
                </Text>
              </YStack>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            renderExtraItem ? (
              <>
                {renderExtraItem()}
                {showMore && (
                  <View
                    marginRight={-100}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <SizableText color="#F214FF" fontWeight="600">
                      See more
                    </SizableText>
                  </View>
                )}
              </>
            ) : null
          }
          /*           ListHeaderComponent={
            renderExtraItem ? (
              <>
                {renderExtraItem()}
                <ListFooter showMore={showMore} />
              </>
            ) : null
          } */
          /*           ListFooterComponent={
            // render the extra element if thats a thign then the see more if thats a thing also
            renderExtraItem ? (
              <>
                {renderExtraItem()}
                <ListFooter showMore={showMore} />
              </>
            ) : (
              <ListFooter showMore={showMore} />
            )
          } */
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
}

export default PeopleCarousel;
