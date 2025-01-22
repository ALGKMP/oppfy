import { cloneElement } from "react";
import type { IconProps } from "@tamagui/helpers-icon";
import { Paragraph, SizableText, YStack } from "tamagui";

type Icon = JSX.Element;

interface EmptyPlaceholderProps {
  title: string;
  subtitle?: string;
  icon?: Icon;
}

export const EmptyPlaceholder = ({
  title,
  subtitle,
  icon,
}: EmptyPlaceholderProps) => (
  <YStack alignItems="center" gap="$2">
    {icon &&
      cloneElement(icon, {
        size: ((icon.props as IconProps).size as string) || "$10",
      })}

    <YStack>
      <SizableText textAlign="center" size="$8" fontWeight="bold">
        {title}
      </SizableText>

      {subtitle && (
        <Paragraph textAlign="center" theme="alt1">
          {subtitle}
        </Paragraph>
      )}
    </YStack>
  </YStack>
);
