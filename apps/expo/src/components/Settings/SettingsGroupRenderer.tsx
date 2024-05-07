import React from "react";
import type { IconProps } from "@tamagui/helpers-icon";
import {
  ListItem,
  Separator,
  SizableText,
  XStack,
  YGroup,
  YStack,
} from "tamagui";

type IconProp = JSX.Element;

export interface SettingsItem {
  title: string;
  subtitle?: string | undefined;
  icon?: IconProp | undefined;
  iconAfter?: IconProp | undefined;
  hoverTheme?: boolean | undefined;
  pressTheme?: boolean | undefined;
  onPress?: () => void;
}

export interface SettingsGroup {
  headerTitle: string;
  items: SettingsItem[];
}

const renderSettingsGroup = (group: SettingsGroup) => (
  <YStack gap="$2" key={group.headerTitle}>
    <SizableText size="$1" theme="alt1">
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
                  React.cloneElement(item.icon, {
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
                React.cloneElement(item.iconAfter, {
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

export default renderSettingsGroup;
