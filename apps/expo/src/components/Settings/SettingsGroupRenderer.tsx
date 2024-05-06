import React from "react";
import { ListItem, Separator, SizableText, YGroup, YStack } from "tamagui";

type IconProp = JSX.Element;

export interface SettingsItem {
  title: string;
  icon: IconProp | undefined;
  iconAfter: IconProp | undefined;
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
            hoverTheme
            pressTheme
            size="$4.5"
            title={item.title}
            icon={item.icon}
            iconAfter={item.iconAfter}
          />
        </YGroup.Item>
      ))}
    </YGroup>
  </YStack>
);

export default renderSettingsGroup;
