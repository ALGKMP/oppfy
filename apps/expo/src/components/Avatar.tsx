import type { ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import defaultProfilePicture from "@assets/default-profile-picture.jpg";

interface AvatarProps {
  source: ImageSourcePropType | string | null;
  size?: number;
}

const Avatar = (props: AvatarProps) => (
  <Image
    source={props.source ?? defaultProfilePicture}
    style={{
      width: props.size ?? 46,
      height: props.size ?? 46,
      borderRadius: props.size ? props.size / 2 : 23,
    }}
  />
);

export default Avatar;
