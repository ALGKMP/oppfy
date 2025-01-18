import type { ReactNode } from "react";
import { TouchableOpacity } from "react-native";
import { Info } from "@tamagui/lucide-icons";
import {
  styled,
  H1 as TamaguiH1,
  H2 as TamaguiH2,
  H3 as TamaguiH3,
  H4 as TamaguiH4,
  H5 as TamaguiH5,
  H6 as TamaguiH6,
  XStack,
} from "tamagui";
import type { XStackProps } from "tamagui";

import { useDialogController } from "./Dialog";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface InfoDialogProps {
  title: string;
  subtitle: string;
  acceptText?: string;
}

export interface HeaderTitleProps extends XStackProps {
  children: React.ReactNode;
  icon?: IconName;
  iconAfter?: IconName;
  iconSize?: number;
  iconColor?: string;
  info?: InfoDialogProps;
}

export const H1 = styled(TamaguiH1, {});
export const H2 = styled(TamaguiH2, {});
export const H3 = styled(TamaguiH3, {});
export const H4 = styled(TamaguiH4, {});
export const H5 = styled(TamaguiH5, {});
export const H6 = styled(TamaguiH6, {});

export const HeaderTitle = ({
  children,
  icon,
  iconAfter,
  iconSize = 14,
  iconColor,
  info,
  ...props
}: HeaderTitleProps) => {
  const dialog = useDialogController();

  return (
    <XStack alignItems="center" gap="$2" opacity={0.7} {...props}>
      {icon && <Icon name={icon} size={iconSize} color={iconColor} />}
      <H5>{children}</H5>
      {iconAfter && <Icon name={iconAfter} size={iconSize} color={iconColor} />}
      {info && (
        <TouchableOpacity
          onPress={() => {
            void dialog.show({
              title: info.title,
              subtitle: info.subtitle,
              acceptText: info.acceptText,
            });
          }}
        >
          <Info size={iconSize} color={iconColor ?? "$blue9"} />
        </TouchableOpacity>
      )}
    </XStack>
  );
};
