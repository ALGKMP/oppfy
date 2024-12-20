import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import { MotiView } from "moti";
import { getToken } from "tamagui";

import { Button, H5, H6, Text, YStack } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";

type RecommendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

interface GridSuggestionsProps {
  data?: RecommendationItem[];
  isLoading?: boolean;
  onFollow: (userId: string) => void;
  onProfilePress: (userId: string, username: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_PADDING = 16;
const GRID_GAP = 12;
const AVAILABLE_WIDTH = SCREEN_WIDTH - CONTAINER_PADDING * 2;
const ITEM_WIDTH = (AVAILABLE_WIDTH - GRID_GAP) / 2;

const GridSuggestions: React.FC<GridSuggestionsProps> = ({
  data,
  isLoading,
  onFollow,
  onProfilePress,
}) => {
  if (isLoading) {
    return (
      <YStack px="$4">
        <H5 mb="$4" theme="alt1">
          Suggested for You
        </H5>
        <YStack flexDirection="row" flexWrap="wrap" gap={GRID_GAP}>
          {Array.from({ length: 4 }).map((_, i) => (
            <MotiView
              key={i}
              from={{ opacity: 0.3, scale: 0.95 }}
              animate={{ opacity: 0.7, scale: 1 }}
              transition={{
                type: "timing",
                duration: 2000,
                loop: true,
              }}
              style={styles.skeletonCard}
            />
          ))}
        </YStack>
      </YStack>
    );
  }

  if (!data?.length) {
    return (
      <YStack px="$4">
        <H5 mb="$4" theme="alt1">
          Suggested for You
        </H5>
        <H6 theme="alt2">No suggestions available</H6>
      </YStack>
    );
  }

  const renderItem = ({
    item,
    index,
  }: {
    item: RecommendationItem;
    index: number;
  }) => (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.8,
        translateY: 30,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      transition={{
        type: "spring",
        damping: 15,
        delay: index * 100,
      }}
      style={styles.cardContainer}
    >
      <YStack
        style={styles.card}
        pressStyle={{
          scale: 0.96,
          transform: [{ translateY: 5 }],
        }}
        onPress={() => onProfilePress(item.userId, item.username)}
      >
        <Image
          source={item.profilePictureUrl}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradient}
        />

        <YStack style={styles.contentOverlay} gap="$2">
          <Text
            numberOfLines={1}
            fontWeight="600"
            fontSize={16}
            color="$color"
            style={styles.username}
          >
            {item.username}
          </Text>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 100 + 200 }}
          >
            <Button
              icon={UserRoundPlus}
              size="$3.5"
              variant="primary"
              onPress={() => onFollow(item.userId)}
              pressStyle={{ scale: 0.95 }}
              chromeless
              backgroundColor="$background"
              borderRadius="$10"
            >
              Follow
            </Button>
          </MotiView>
        </YStack>
      </YStack>
    </MotiView>
  );

  return (
    <YStack>
      <FlashList
        data={data.slice(0, 6)}
        renderItem={renderItem}
        estimatedItemSize={ITEM_WIDTH}
        ListHeaderComponent={
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500 }}
          >
            <H5 theme="alt1">Suggested for You</H5>
          </MotiView>
        }
        numColumns={2}
        ListHeaderComponentStyle={{
          marginBottom: getToken("$4", "space"),
          paddingHorizontal: CONTAINER_PADDING,
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
      />
    </YStack>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: GRID_GAP,
  },
  cardContainer: {
    width: ITEM_WIDTH,
    marginBottom: GRID_GAP,
    aspectRatio: 1,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "$background",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
    flex: 1,
  },
  image: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  contentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  username: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skeletonCard: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    backgroundColor: "$gray5",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
});

export default GridSuggestions;
