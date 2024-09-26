import type { ImageSourcePropType } from "react-native";
import defaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Image, styled } from "tamagui";

interface AvatarProps {
  source: ImageSourcePropType | string | null | undefined;
  size?: number;
  bordered?: boolean;
}

const StyledImage = styled(Image, {
  borderRadius: 1000,
  variants: {
    bordered: {
      true: {
        borderWidth: 2,
        borderColor: "$primary",
      },
    },
  },
});

const Avatar = ({ source, size = 46, bordered = false }: AvatarProps) => {
  return (
    <StyledImage
      source={
        typeof source === "string"
          ? source !== ""
            ? { uri: source }
            : defaultProfilePicture
          : source ?? defaultProfilePicture
      }
      width={size}
      height={size}
      bordered={bordered}
    />
  );
};

export default Avatar;
