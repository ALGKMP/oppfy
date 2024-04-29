// import { config } from "@tamagui/config";
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

const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    ...config.fonts,
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
