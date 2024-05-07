import { cloneElement } from "react";
import type { IconProps } from "@tamagui/helpers-icon";
import {
  ListItem,
  Separator,
  SizableText,
  XStack,
  YGroup,
  YStack,
} from "tamagui";

type Icon = JSX.Element;

export interface SettingsItemParams {
  title: string;
  subtitle?: string | undefined;
  icon?: Icon | undefined;
  iconAfter?: Icon | undefined;
  hoverTheme?: boolean | undefined;
  pressTheme?: boolean | undefined;
  onPress?: () => void;
}

export const SettingsItem = (item: SettingsItemParams) => {
  return (
    <ListItem
      size="$4.5"
      onPress={item.onPress}
      hoverTheme={item.hoverTheme ?? true}
      pressTheme={item.pressTheme ?? true}
    >
      <XStack flex={1} alignItems="center">
        <XStack flex={1} alignItems="center" gap="$2">
          {item.icon &&
            cloneElement(item.icon, {
              size: ((item.icon.props as IconProps).size as string) || "$1",
            })}
          <YStack>
            <SizableText size="$5">{item.title}</SizableText>
            {item.subtitle && (
              <SizableText size="$3" theme="alt1">
                {item.subtitle}
              </SizableText>
            )}
          </YStack>
        </XStack>
        {item.iconAfter &&
          cloneElement(item.iconAfter, {
            size: ((item.iconAfter.props as IconProps).size as string) || "$1",
          })}
      </XStack>
    </ListItem>
  );
};

export interface SettingsGroupInput {
  headerTitle: string;
  items: SettingsItemParams[];
}

export const renderSettingsGroup = (group: SettingsGroupInput) => (
  <YStack gap="$2" key={group.headerTitle}>
    <SizableText size="$3" theme="alt1">
      {group.headerTitle}
    </SizableText>
    <YGroup alignSelf="center" bordered separator={<Separator />}>
      {group.items.map((item, index) => (
        <YGroup.Item key={index}>
          <ListItem
            size="$4.5"
            onPress={item.onPress}
            hoverTheme={item.hoverTheme ?? true}
            pressTheme={item.pressTheme ?? true}
          >
            <XStack flex={1} alignItems="center">
              <XStack flex={1} alignItems="center" gap="$2">
                {item.icon &&
                  cloneElement(item.icon, {
                    size:
                      ((item.icon.props as IconProps).size as string) || "$1",
                  })}
                <YStack>
                  <SizableText size="$5">{item.title}</SizableText>
                  {item.subtitle && (
                    <SizableText size="$3" theme="alt1">
                      {item.subtitle}
                    </SizableText>
                  )}
                </YStack>
              </XStack>
              {item.iconAfter &&
                cloneElement(item.iconAfter, {
                  size:
                    ((item.iconAfter.props as IconProps).size as string) ||
                    "$1",
                })}
            </XStack>
          </ListItem>
        </YGroup.Item>
      ))}
    </YGroup>
  </YStack>
);

export default SettingsItem;
