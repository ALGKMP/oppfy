import type { SizeTokens } from "@tamagui/core";
import { getVariableValue, styled } from "@tamagui/core";
import { getSize } from "@tamagui/get-token";
import { ThemeableStack, YStack } from "@tamagui/stacks";
import { createSwitch } from "@tamagui/switch";
import { SwitchContext } from "tamagui";

export const SwitchThumb = styled(ThemeableStack, {
  name: "SwitchThumb",
  context: SwitchContext,

  variants: {
    unstyled: {
      false: {
        size: "$true",
        backgroundColor: "white",
        borderRadius: 1000,
      },
    },

    checked: {
      true: {},
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
    unstyled: false,
  },
});

const getSwitchHeight = (val: SizeTokens) =>
  Math.round(getVariableValue(getSize(val)) * 0.65);

const getSwitchWidth = (val: SizeTokens) => getSwitchHeight(val) * 2;

export const SwitchFrame = styled(YStack, {
  name: "Switch",
  context: SwitchContext,

  variants: {
    unstyled: {
      false: {
        size: "$true",
        borderRadius: 1000,
        backgroundColor: "$background",
        borderWidth: 2,
        borderColor: "transparent",

        focusStyle: {
          outlineColor: "$borderColorFocus",
          outlineStyle: "solid",
          outlineWidth: 2,
        },
      },
    },

    checked: {
      true: {
        backgroundColor: "$blue9",
      },
    },

    frameWidth: {
      ":number": () => null,
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
    unstyled: false,
  },
});

export default createSwitch({
  Frame: SwitchFrame,
  Thumb: SwitchThumb,
});
