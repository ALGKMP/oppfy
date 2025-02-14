import React from "react";
import type { ImageSourcePropType } from "react-native";
import defaultProfilePicture from "@assets/default_profile_picture.jpg";
import type { ImageProps } from "tamagui";
import { Image, Stack } from "tamagui";

interface AvatarProps {
  source: ImageSourcePropType | string | null | undefined;
  size?: number;
  bordered?: boolean;
  recyclingKey?: string;
  style?: ImageProps["style"];
}

export const Avatar = (props: AvatarProps) => {
  const size = props.size ?? 46;
  const imageSize = size - (props.bordered ? 4 : 0);

  return (
    <Stack
      width={size}
      height={size}
      justifyContent="center"
      alignItems="center"
    >
      {/* Gray background with optional border */}
      <Stack
        position="absolute"
        width={imageSize}
        height={imageSize}
        backgroundColor="$gray4"
        borderRadius={imageSize / 2}
        borderWidth={props.bordered ? 2 : 0}
        borderColor="$primary"
      />

      {/* Image */}
      <Image
        source={
          typeof props.source === "string"
            ? { uri: props.source }
            : (props.source ?? defaultProfilePicture)
        }
        style={[
          props.style,
          {
            width: imageSize,
            height: imageSize,
            borderRadius: imageSize / 2,
          },
        ]}
      />
    </Stack>
  );
};
