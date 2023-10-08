import { config } from "@tamagui/config";
import { createFont, createTamagui } from "tamagui";
import { createInterFont } from "@tamagui/font-inter";
// import from "@tamagui/them"

const headingFont = createFont(
  {
    size: {
      4: 2,
      5: 13,
      6: 15,
      9: 35,
      10: 44,
    },
    weight: {
      6: '400',
      7: '700',
    },
    color: {
      6: '$colorFocus',
      7: '$color',
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
    lineHeight: {
      5: 50,
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
      100: { normal: 'SpartanThin' },
      200: { normal: 'SpartanExtraLight' },
      300: { normal: 'SpartanLight' },
      400: { normal: 'SpartanRegular' },
      500: { normal: 'SpartanMedium' },
      600: { normal: 'SpartanSemiBold' },
      700: { normal: 'SpartanBold' },
      800: { normal: 'SpartanExtraBold' },
    },
  },
);

const bodyFont = createInterFont(
  {
    weight: {
      1: '400',
      7: '600',
    },
  },
  {
    sizeSize: (size) => Math.round(size),
    sizeLineHeight: (size) => Math.round(size * 1.1 + (size >= 12 ? 8 : 4)),
  }
)

const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
});

// this makes typescript properly type everything based on the config
type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
export default tamaguiConfig;
// depending on if you chose tamagui, @tamagui/core, or @tamagui/web

// be sure the import and declare module lines both use that same name
