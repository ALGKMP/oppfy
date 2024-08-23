import type { ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import defaultProfilePicture from "@assets/default-profile-picture.jpg";
import { useTheme } from "tamagui";

interface AvatarProps {
  source: ImageSourcePropType | string | null;
  size?: number;
  bordered?: boolean;
}

const Avatar = (props: AvatarProps) => {
  const theme = useTheme();

  return (
    <Image
      source={props.source ?? defaultProfilePicture}
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
