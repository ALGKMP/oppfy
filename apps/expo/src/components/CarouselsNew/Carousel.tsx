import { TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { getToken, H5, Spacer, Text, View, XStack, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { Skeleton } from "~/components/Skeletons";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import UserItem, { UserItemShortCard } from "./UserItem";

/*
 * ==========================================
 * ============== UI ========================
 * ==========================================
 */

interface CarouselProps {
  title: string;
  onShowMore: () => void;
  isLoading: boolean;
  data: UserItemShortCard[];
}

const Carousel = (props: CarouselProps) => {
  const { title, onShowMore, isLoading, data } = props;

  if (isLoading) {
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

  return (
    <CardContainer paddingHorizontal={0}>
      <YStack gap="$3">
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$3"
        >
          <H5>{title}</H5>
          <TouchableOpacity onPress={onShowMore}>
            <Text theme="alt1" fontSize="$3" fontWeight="600">
              See all
            </Text>
          </TouchableOpacity>
        </XStack>

        <FlashList
          data={data}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <UserItem item={item} />}
          ItemSeparatorComponent={() => <Spacer size="$2.5" />}
          contentContainerStyle={{
            paddingHorizontal: getToken("$2.5", "space") as number,
          }}
        />
      </YStack>
    </CardContainer>
  );
};

export default Carousel;
