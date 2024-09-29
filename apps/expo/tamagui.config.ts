import { config } from "@tamagui/config";
import { createFont, createTamagui } from "tamagui";

const modakFont = createFont({
  family: "Modak",
  weight: {
    1: "400",
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
});

const poppinsFace = {
  normal: { normal: "Poppins-Regular", italic: "Poppins-Italic" },
  500: { normal: "Poppins-Medium", italic: "Poppins-MediumItalic" },
  600: { normal: "Poppins-SemiBold", italic: "Poppins-SemiBoldItalic" },
  700: { normal: "Poppins-Bold", italic: "Poppins-BoldItalic" },
  800: { normal: "Poppins-ExtraBold", italic: "Poppins-ExtraBoldItalic" },
  900: { normal: "Poppins-Black", italic: "Poppins-BlackItalic" },
};

const bodyFont = createFont({
  family: "Poppins",
  size: config.fonts.body.size,
  lineHeight: config.fonts.body.lineHeight,
  weight: config.fonts.body.weight,
  letterSpacing: config.fonts.body.letterSpacing,
  face: poppinsFace,
});

const headingFont = createFont({
  family: "Poppins",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 22,
    6: 28,
    7: 36,
    8: 48,
    9: 64,
    10: 72,
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 40,
    7: 48,
    8: 60,
    9: 76,
    10: 84,
  },
  weight: {
    1: "400",
    2: "400",
    3: "500",
    4: "500",
    5: "600",
    6: "600",
    7: "700",
    8: "700",
    9: "800",
    10: "900",
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: -0.5,
    5: -0.5,
    6: -1,
    7: -1,
    8: -1.5,
    9: -1.5,
    10: -2,
  },
  face: poppinsFace,
});

const tamaguiConfig = createTamagui({
  ...config,
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      primary: "#F214FF",
    },
  },
  fonts: {
    ...config.fonts,
    body: bodyFont,
    heading: headingFont,
    modak: modakFont,
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
