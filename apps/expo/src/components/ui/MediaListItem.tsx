import type { FunctionComponent, ReactNode } from "react";
import React from "react";
import type { ImageSourcePropType } from "react-native";
import { TouchableOpacity } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Image } from "tamagui";
import type { GetProps } from "tamagui";

import { Skeleton } from "~/components/Skeletons";
import { Avatar } from "./Avatar";
import { Button } from "./Buttons";
import { XStack, YStack } from "./Stacks";
import { Paragraph, SizableText } from "./Texts";

export type MediaListItemActionProps = {
  label: string;
} & GetProps<typeof Button>;

interface MediaListItemProps {
  recyclingKey?: string;
  verticalText?: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  caption?: ReactNode;
  imageUrl?: string | ImageSourcePropType;
  primaryAction?: MediaListItemActionProps;
  secondaryAction?: MediaListItemActionProps;
  onPress?: () => void;
}

export const MediaListItem = ({
  recyclingKey,
  verticalText,
  title,
  subtitle,
  caption,
  imageUrl,
  primaryAction,
  secondaryAction,
  onPress,
}: MediaListItemProps) => {
  const content = (
    <XStack alignItems="center" gap="$3">
      {imageUrl && (
        <Image
          key={recyclingKey}
          source={typeof imageUrl === "string" ? { uri: imageUrl } : imageUrl}
          width={56}
          height={56}
          borderRadius={28}
        />
        // <Avatar source={imageUrl} size={56} />
        // <ExpoImage
        //   source={typeof imageUrl === "string" ? { uri: imageUrl } : imageUrl}
        //   style={{ width: 56, height: 56, borderRadius: 28 }}
        //   recyclingKey={recyclingKey}
        // />
      )}

      {verticalText ? (
        <Paragraph flex={1}>
          {typeof title === "string" ? (
            <SizableText size="$4" fontWeight="bold" lineHeight={0}>
              {title}
            </SizableText>
          ) : (
            title
          )}{" "}
          {subtitle &&
            (typeof subtitle === "string" ? (
              <SizableText color="$gray12" size="$3" lineHeight={0}>
                {subtitle}
              </SizableText>
            ) : (
              subtitle
            ))}{" "}
          {caption &&
            (typeof caption === "string" ? (
              <SizableText color="$gray10" size="$2" lineHeight={0}>
                {caption}
              </SizableText>
            ) : (
              caption
            ))}
        </Paragraph>
      ) : (
        <YStack flex={1} gap="$1.5">
          {typeof title === "string" ? (
            <SizableText size="$4" fontWeight="bold" lineHeight={0}>
              {title}
            </SizableText>
          ) : (
            title
          )}

          {subtitle &&
            (typeof subtitle === "string" ? (
              <SizableText theme="alt1" size="$3" lineHeight={0}>
                {subtitle}
              </SizableText>
            ) : (
              subtitle
            ))}

          {caption && (
            <SizableText theme="alt2" size="$2" lineHeight={0}>
              {caption}
            </SizableText>
          )}
        </YStack>
      )}

      {(primaryAction || secondaryAction) && (
        <XStack gap="$2">
          {primaryAction && (
            <Button size="$3.5" {...primaryAction}>
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button size="$3.5" {...secondaryAction}>
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

MediaListItem.Skeleton = () => (
  <XStack alignItems="center" gap="$3">
    <Skeleton circular size={56} />

    <YStack flex={1} gap="$1.5">
      <Skeleton width={80} height={18} />
      <Skeleton width={140} height={16} />
    </YStack>

    <XStack gap="$2">
      <Skeleton width={100} height="$3.5" />
    </XStack>
  </XStack>
);
