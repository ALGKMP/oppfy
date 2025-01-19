import React from "react";
import type { ImageSourcePropType } from "react-native";
import defaultProfilePicture from "@assets/default-profile-picture.jpg";
import type { ImageProps } from "tamagui";
import { Image, Stack, useTheme } from "tamagui";

interface AvatarProps {
  source: ImageSourcePropType | string | null | undefined;
  size?: number;
  bordered?: boolean;
  recyclingKey?: string;
  style?: ImageProps["style"];
}

export const Avatar = (props: AvatarProps) => {
  const theme = useTheme();
  const size = props.size ?? 46;

  return (
    <Stack
      width={size}
      height={size}
      justifyContent="center"
      alignItems="center"
    >
      {props.bordered && (
        <>
          {/* Primary glow effect */}
          <Stack
            position="absolute"
            width={size}
            height={size}
            style={{
              borderRadius: size / 2,
              borderWidth: 2,
              borderColor: theme.primary.val as string,
              shadowColor: theme.primary.val as string,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 6,
              elevation: 10,
            }}
          />

          {/* Inner highlight ring */}
          <Stack
            position="absolute"
            width={size - 2}
            height={size - 2}
            style={{
              borderRadius: (size - 2) / 2,
              borderWidth: 1.5,
              borderColor: `${theme.primary.val}CC`,
              shadowColor: theme.primary.val as string,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 3,
              elevation: 12,
            }}
          />
        </>
      )}

      {/* Actual image */}
      <Image
        source={
          typeof props.source === "string"
            ? { uri: props.source }
            : (props.source ?? defaultProfilePicture)
        }
        style={[
          props.style,
          {
            width: size - (props.bordered ? 4 : 0),
            height: size - (props.bordered ? 4 : 0),
            borderRadius: (size - (props.bordered ? 4 : 0)) / 2,
          },
        ]}
      />
    </Stack>
  );
};
