import type { ImageSourcePropType } from "react-native";
import defaultProfilePicture from "@assets/default-profile-picture.jpg";
// import { Image } from "expo-image";
import { Image, useTheme } from "tamagui";

interface AvatarProps {
  source: ImageSourcePropType | string | null | undefined;
  size?: number;
  bordered?: boolean;
  recyclingKey?: string;
}

const Avatar = (props: AvatarProps) => {
  const theme = useTheme();

  return (
    <Image
      source={
        typeof props.source === "string"
          ? { uri: props.source }
          : (props.source ?? defaultProfilePicture)
      }
      // recyclingKey={props.recyclingKey}
      style={{
        width: props.size ?? 46,
        height: props.size ?? 46,
        borderRadius: props.size ? props.size / 2 : 23,
        borderWidth: props.bordered ? 2 : 0,
        borderColor: theme.primary.val as string,
      }}
    />
  );
};

export default Avatar;
