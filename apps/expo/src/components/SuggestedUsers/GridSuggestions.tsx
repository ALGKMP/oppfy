import React from "react";
import { Dimensions, FlatList, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
        <YStack
          flexDirection="row"
          flexWrap="wrap"
          gap={getToken("$3", "space")}
        >
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
            opacity={0.85}
          >
            {item.username}
          </Text>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 100 + 200 }}
          >
            <Button
              size="$3"
              variant="primary"
              icon={UserRoundPlus}
              pressStyle={{ scale: 0.95 }}
              opacity={0.85}
              onPress={() => onFollow(item.userId)}
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
      <FlatList
        data={data.slice(0, 6)}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500 }}
          >
            <H5 theme="alt1">Suggested for You</H5>
          </MotiView>
        }
        columnWrapperStyle={{
          gap: getToken("$3", "space"),
        }}
        contentContainerStyle={{
          gap: getToken("$3", "space"),
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </YStack>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    aspectRatio: 1,
  },
  card: {
    borderRadius: getToken("$6", "radius"),
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
    aspectRatio: 1,
    width: "100%",
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
    padding: getToken("$3", "space"),
  },
  username: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skeletonCard: {
    aspectRatio: 1,
    backgroundColor: "$gray5",
    borderRadius: getToken("$5", "radius"),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
});

export default GridSuggestions;
