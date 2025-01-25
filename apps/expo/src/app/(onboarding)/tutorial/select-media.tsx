import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, Image as ImageIcon } from "@tamagui/lucide-icons";

import {
  Button,
  H2,
  OnboardingButton,
  Paragraph,
  ScreenView,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_WIDTH = (SCREEN_WIDTH - 48) / 3;

const SelectMedia = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    number: string;
    recipientName: string;
    recipientImage?: string;
  }>();

  const [recentPhotos, setRecentPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaLibrary.Asset | null>(
    null,
  );

  const loadRecentPhotos = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") return;

    const { assets } = await MediaLibrary.getAssetsAsync({
      first: 9,
      mediaType: ["photo", "video"],
      sortBy: ["creationTime"],
    });

    setRecentPhotos(assets);
  }, []);

  useEffect(() => {
    void loadRecentPhotos();
  }, [loadRecentPhotos]);

  const handleContinue = () => {
    if (!selectedAsset) return;

    router.push({
      pathname: "/tutorial/caption",
      params: {
        uri: selectedAsset.uri,
        width: selectedAsset.width,
        height: selectedAsset.height,
        type: selectedAsset.mediaType,
        name: params.name,
        number: params.number,
        recipientName: params.recipientName,
        recipientImage: params.recipientImage,
      },
    });
  };

  return (
    <ScreenView
      backgroundColor="$background"
      padding="$0"
      justifyContent="space-between"
    >
      <YStack flex={1} paddingHorizontal="$4" gap="$6" paddingTop="$8">
        <YStack gap="$2">
          <H2 textAlign="center">Pick Your First Share</H2>
          <Paragraph textAlign="center" color="$gray11">
            Choose a photo or video to share with {params.name}
          </Paragraph>
        </YStack>

        {/* Tutorial Card */}
        <XStack
          backgroundColor="$gray3"
          padding="$4"
          borderRadius="$4"
          gap="$4"
          alignItems="center"
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
          }}
        >
          <ImageIcon size={24} color="$primary" />
          <YStack flex={1}>
            <Text color="$gray11" fontSize="$3">
              Tap any recent photo or video below to select it for sharing
            </Text>
          </YStack>
        </XStack>

        {/* Recent Photos Grid */}
        <YStack gap="$4">
          <Text fontWeight="bold" fontSize="$4" color="$gray11">
            Recent Media
          </Text>

          <View flexDirection="row" flexWrap="wrap" gap="$2">
            {recentPhotos.map((asset, index) => (
              <Button
                key={asset.id}
                onPress={() => setSelectedAsset(asset)}
                animation="quick"
                enterStyle={{
                  opacity: 0,
                  scale: 0.9,
                }}
                pressStyle={{
                  scale: 0.95,
                }}
                animation-delay={`${index * 100}ms`}
                padding={0}
                backgroundColor="transparent"
              >
                <Image
                  source={{ uri: asset.uri }}
                  style={[
                    styles.thumbnail,
                    selectedAsset?.id === asset.id && styles.selectedThumbnail,
                  ]}
                  transition={200}
                />
                {asset.mediaType === "video" && (
                  <View style={styles.videoBadge}>
                    <Text fontSize={10} color="white">
                      {Math.floor(asset.duration)}s
                    </Text>
                  </View>
                )}
              </Button>
            ))}
          </View>
        </YStack>
      </YStack>

      {/* Bottom Button */}
      <YStack
        padding="$4"
        paddingBottom="$6"
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$gray5"
      >
        <OnboardingButton
          icon={ArrowRight}
          onPress={handleContinue}
          disabled={!selectedAsset}
        >
          Continue
        </OnboardingButton>
      </YStack>
    </ScreenView>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 8,
  },
  selectedThumbnail: {
    borderWidth: 3,
    borderColor: "#007AFF", // iOS blue color as fallback
  },
  videoBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default SelectMedia;
