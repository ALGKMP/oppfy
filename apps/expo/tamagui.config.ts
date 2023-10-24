import { config, createGenericFont } from "@tamagui/config";
import { createInterFont } from "@tamagui/font-inter";
import { createSilkscreenFont } from "@tamagui/font-silkscreen";
import { themes, tokens } from "@tamagui/themes";
import { createFont, createTamagui, createTokens } from "tamagui";

const silkscreenFont = createSilkscreenFont();

const headingFont = createInterFont(
  {
    size: {
      5: 13,
      6: 15,
      9: 32,
      10: 44,
    },
    transform: {
      6: "uppercase",
      7: "none",
    },
    weight: {
      6: "400",
      7: "700",
    },
    color: {
      6: "$colorFocus",
      7: "$color",
    },
    letterSpacing: {
      5: 2,
      6: 1,
      7: 0,
      8: 0,
      9: -1,
      10: -1.5,
      12: -2,
      14: -3,
      15: -4,
    },
    // for native
    face: {
      700: { normal: "InterBold" },
      800: { normal: "InterBold" },
      900: { normal: "InterBold" },
    },
  },
  { sizeLineHeight: (size) => Math.round(size * 1.1 + (size < 30 ? 10 : 5)) },
);

const bodyFont = createInterFont(
  {
    weight: {
      1: "400",
      7: "600",
    },
  },
  {
    sizeSize: (size) => Math.round(size),
    sizeLineHeight: (size) => Math.round(size * 1.1 + (size >= 12 ? 8 : 4)),
  },
);

const monoFont = createGenericFont(
  `"ui-monospace", "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`,
  {
    weight: {
      1: "500",
    },
    size: {
      1: 11,
      2: 12,
      3: 13,
      4: 14,
      5: 16,
      6: 18,
      7: 20,
      8: 22,
      9: 30,
      10: 42,
      11: 52,
      12: 62,
      13: 72,
      14: 92,
      15: 114,
      16: 124,
    },
  },
  {
    sizeLineHeight: (x) => x * 1.5,
  },
);

const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    heading: headingFont,
    body: bodyFont,
    mono: monoFont,
    silkscreen: silkscreenFont,
  },
});

// this makes typescript properly type everything based on the config
type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}
}
export default tamaguiConfig;
// depending on if you chose tamagui, @tamagui/core, or @tamagui/web

// be sure the import and declare module lines both use that same name
