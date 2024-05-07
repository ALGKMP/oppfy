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

export interface SettingsGroupInput {
  headerTitle: string;
  items: SettingsItemParams[];
}

const renderSettingsGroup = (group: SettingsGroupInput) => (
  <YStack gap="$2" key={group.headerTitle}>
    <Header headerTitle={group.headerTitle} />
    <YGroup alignSelf="center" bordered separator={<Separator />}>
      {group.items.map((item, index) => (
        <SettingsItem key={index} {...item} />
      ))}
    </YGroup>
  </YStack>
);

interface HeaderProps {
  headerTitle: string;
}

const Header = ({ headerTitle }: HeaderProps) => (
  <SizableText size="$3" theme="alt1">
    {headerTitle}
  </SizableText>
);

const SettingsItem = (item: SettingsItemParams) => {
  return (
    <YGroup.Item>
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
            React.cloneElement(item.iconAfter, {
              size:
                ((item.iconAfter.props as IconProps).size as string) || "$1",
            })}
        </XStack>
      </ListItem>
    </YGroup.Item>
  );
};

export default renderSettingsGroup;
