import type {ReactNode} from "react";
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
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface HeaderTitleProps extends XStackProps {
  children: ReactNode;
  icon?: IconName;
  iconAfter?: IconName;
  iconSize?: number;
  iconColor?: string;
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
  ...props
}: HeaderTitleProps) => (
  <XStack alignItems="center" gap="$2" opacity={0.7} {...props}>
    {icon && <Icon name={icon} size={iconSize} color={iconColor} />}
    <H5>{children}</H5>
    {iconAfter && <Icon name={iconAfter} size={iconSize} color={iconColor} />}
  </XStack>
);
