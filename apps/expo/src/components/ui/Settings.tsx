import React, { cloneElement, createContext, useContext } from "react";
import type { IconProps } from "@tamagui/helpers-icon";
import { Separator, Stack } from "tamagui";

import { H6 } from "./Headings";
import { ListItem } from "./ListItem";
import { XStack, YStack } from "./Stacks";
import { SizableText } from "./Texts";

type Icon = JSX.Element;

export interface SettingsItemProps {
  title: string;
  subtitle?: string;
  icon?: Icon;
  iconAfter?: Icon;
  hoverTheme?: boolean;
  pressTheme?: boolean;
  onPress?: () => void;
}

export const SettingsItem = (props: SettingsItemProps) => {
  const {
    title,
    subtitle,
    icon,
    iconAfter,
    hoverTheme = true,
    pressTheme = true,
    onPress,
  } = props;

  return (
    <ListItem
      size="$4.5"
      backgroundColor="$gray2"
      onPress={onPress}
      hoverTheme={hoverTheme}
      pressTheme={pressTheme}
      overflow="hidden"
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
  );
};

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

interface SettingsGroupContextValue {
  index: number;
  isLastItem: boolean;
}

const SettingsGroupContext = createContext<SettingsGroupContextValue>({
  index: 0,
  isLastItem: false,
});

const SettingsGroupRoot = ({ title, children }: SettingsGroupProps) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <YStack gap="$2">
      <H6 theme="alt1">{title}</H6>
      <Stack
        borderRadius="$6"
        backgroundColor="$gray2"
        overflow="hidden"
        width="100%"
      >
        {childrenArray.map((child, index) => (
          <SettingsGroupContext.Provider
            key={index}
            value={{
              index,
              isLastItem: index === childrenArray.length - 1,
            }}
          >
            {child}
          </SettingsGroupContext.Provider>
        ))}
      </Stack>
    </YStack>
  );
};

type SettingsGroupItemProps = SettingsItemProps & {
  showSeparator?: boolean;
};

const SettingsGroupItem = ({
  showSeparator = true,
  ...itemProps
}: SettingsGroupItemProps) => {
  const { isLastItem } = useContext(SettingsGroupContext);

  return (
    <Stack>
      <SettingsItem {...itemProps} />
      {showSeparator && !isLastItem && <Separator />}
    </Stack>
  );
};

export const SettingsGroup = Object.assign(SettingsGroupRoot, {
  Item: SettingsGroupItem,
});
