import type { ReactNode } from "react";
import React from "react";
import type { ImageSourcePropType } from "react-native";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Button, SizableText, XStack, YStack } from "tamagui";

import { Skeleton } from "~/components/Skeletons";

type ActionProps = {
  label: string;
  onPress: () => void;
};

type MediaListItemProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  imageUrl?: string | ImageSourcePropType;
  primaryAction?: ActionProps;
  secondaryAction?: ActionProps;
  onPress?: () => void;
};

export const MediaListItem = (props: MediaListItemProps) => {
  const { title, subtitle, imageUrl, primaryAction, secondaryAction, onPress } =
    props;

  const content = (
    <XStack alignItems="center" padding="$3" gap="$3">
      {imageUrl && (
        <Image
          source={imageUrl}
          style={{ width: 56, height: 56, borderRadius: 28 }}
        />
      )}

      <YStack flex={1} gap="$1">
        {typeof title === "string" ? (
          <SizableText fontWeight="bold" size="$4">
            {title}
          </SizableText>
        ) : (
          title
        )}

        {subtitle &&
          (typeof subtitle === "string" ? (
            <SizableText theme="alt1" size="$3">
              {subtitle}
            </SizableText>
          ) : (
            subtitle
          ))}
      </YStack>

      {(primaryAction || secondaryAction) && (
        <XStack gap="$2">
          {primaryAction && (
            <Button size="$3" onPress={primaryAction.onPress}>
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button size="$3" theme="alt2" onPress={secondaryAction.onPress}>
              {secondaryAction.label}
            </Button>
          )}
        </XStack>
      )}
    </XStack>
  );

  if (!onPress) return content;

  return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
};

export const MediaListItemSkeleton = () => (
  <XStack alignItems="center" padding="$3" gap="$3">
    <Skeleton circular size={56} />
    <YStack flex={1} gap="$1">
      <Skeleton width={120} height={20} />
      <Skeleton width={180} height={16} />
    </YStack>
    <XStack gap="$2">
      <Skeleton width={90} height={36} />
      <Skeleton width={90} height={36} />
    </XStack>
  </XStack>
);
