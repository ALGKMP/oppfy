import React from "react";
import type { ImageSourcePropType } from "react-native";
import defaultProfilePicture from "@assets/default_profile_picture.jpg";
import type { ImageProps } from "tamagui";
import { Image, Stack, useTheme } from "tamagui";

interface AvatarProps {
  source: ImageSourcePropType | string | null | undefined;
  size?: number;
  bordered?: boolean;
  style?: ImageProps["style"];
}

export const Avatar = (props: AvatarProps) => {
  const { source, size = 46, bordered = false, style } = props;

  const theme = useTheme();
  // If there's a border, let's add those extra pixels around the image instead of shrinking it
  const borderWidth = bordered ? 2 : 0;
  // The total bounding box includes the outer border
  const totalSize = size + borderWidth * 2;

  return (
    <Stack
      width={totalSize}
      height={totalSize}
      alignItems="center"
      justifyContent="center"
      borderRadius={totalSize / 2}
      borderWidth={borderWidth}
      borderColor={theme.primary.val as string}
      backgroundColor="$gray4"
    >
      <Image
        source={
          typeof source === "string"
            ? { uri: source }
            : (source ?? defaultProfilePicture)
        }
        style={[
          style,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </Stack>
  );
};
