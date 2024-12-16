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

export interface SettingsListItemParams {
  title: string;
  subtitle?: string | undefined;
  icon?: Icon | undefined;
  iconAfter?: Icon | undefined;
  hoverTheme?: boolean | undefined;
  pressTheme?: boolean | undefined;
  onPress?: () => void;
}

export const SettingsListItem = (item: SettingsListItemParams) => {
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

export interface SettingsListInput {
  headerTitle: string;
  items: SettingsListItemParams[];
}

export const renderSettingsList = (group: SettingsListInput) => (
  <YStack gap="$2" key={group.headerTitle}>
    <H6 theme="alt1">{group.headerTitle}</H6>

    <YGroup alignSelf="center" separator={<Separator />}>
      {group.items.map((item, index) => (
        <YGroup.Item key={index}>
          <ListItem
            size="$4.5"
            backgroundColor="$gray2"
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

export default SettingsListItem;
