import { cloneElement } from "react";
import type { IconProps } from "@tamagui/helpers-icon";
import {
  H6,
  ListItem,
  Separator,
  SizableText,
  XStack,
  YGroup,
  YStack,
} from "tamagui";

type Icon = JSX.Element;

interface ItemProps {
  title: string;
  subtitle?: string;
  icon?: Icon;
  iconAfter?: Icon;
  hoverTheme?: boolean;
  pressTheme?: boolean;
  onPress?: () => void;
}

interface GroupProps {
  title: string;
  children: React.ReactNode;
}

const Item = ({
  title,
  subtitle,
  icon,
  iconAfter,
  hoverTheme = true,
  pressTheme = true,
  onPress,
}: ItemProps) => {
  return (
    <YGroup.Item>
      <ListItem
        size="$4.5"
        onPress={onPress}
        backgroundColor="$gray2"
        hoverTheme={hoverTheme}
        pressTheme={pressTheme}
      >
        <XStack flex={1} alignItems="center">
          <XStack flex={1} alignItems="center" gap="$2">
            {icon &&
              cloneElement(icon, {
                size: ((icon.props as IconProps).size as string) || "$1",
              })}
            <YStack>
              <SizableText size="$5">{title}</SizableText>
              {subtitle && (
                <SizableText size="$3" theme="alt1">
                  {subtitle}
                </SizableText>
              )}
            </YStack>
          </XStack>
          {iconAfter &&
            cloneElement(iconAfter, {
              size: ((iconAfter.props as IconProps).size as string) || "$1",
            })}
        </XStack>
      </ListItem>
    </YGroup.Item>
  );
};

const SettingsGroup = ({ title, children }: GroupProps) => {
  return (
    <YStack gap="$2">
      <H6 theme="alt1">{title}</H6>
      <YGroup alignSelf="center" separator={<Separator />} borderRadius="$4">
        {children}
      </YGroup>
    </YStack>
  );
};

SettingsGroup.Item = Item;

export type {
  ItemProps as SettingsItemProps,
  GroupProps as SettingsGroupProps,
};
export default SettingsGroup;
