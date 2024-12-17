import type { SizeTokens } from "@tamagui/core";
import { getVariableValue, styled } from "@tamagui/core";
import { getSize } from "@tamagui/get-token";
import { ThemeableStack, YStack } from "@tamagui/stacks";
import { createSwitch } from "@tamagui/switch";

const SwitchThumb = styled(ThemeableStack, {
  name: "SwitchThumb",

  variants: {
    unstyled: {
      false: {
        size: "$true",
        backgroundColor: "$background",
        borderRadius: 1000,
      },
    },

    checked: {
      true: {
        backgroundColor: "white",
      },
    },

    size: {
      "...size": (val) => {
        const size = getSwitchHeight(val);
        return {
          height: size,
          width: size,
        };
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1" ? true : false,
  },
});

const getSwitchHeight = (val: SizeTokens) =>
  Math.round(getVariableValue(getSize(val)) * 0.65);

const getSwitchWidth = (val: SizeTokens) => getSwitchHeight(val) * 2;

const SwitchFrame = styled(YStack, {
  name: "Switch",
  tag: "button",

  variants: {
    unstyled: {
      false: {
        borderRadius: 1000,
        backgroundColor: "$background",
        borderWidth: 2,
        borderColor: "$background",

        focusVisibleStyle: {
          outlineColor: "$outlineColor",
          outlineStyle: "solid",
          outlineWidth: 2,
        },
      },
    },

    checked: {
      true: {
        backgroundColor: "$primary",
        borderColor: "$primary",
      },
    },

    size: {
      "...size": (val) => {
        const height = getSwitchHeight(val) + 4;
        const width = getSwitchWidth(val) + 4;
        return {
          height,
          minHeight: height,
          width,
        };
      },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1" ? true : false,
  },
});

export const Switch = createSwitch({
  Frame: SwitchFrame,
  Thumb: SwitchThumb,
});
