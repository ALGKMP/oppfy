/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Dimensions, Platform } from "react-native";
import { initialWindowMetrics } from "react-native-safe-area-context";

export const CONTENT_SPACING = 15;

const SAFE_BOTTOM =
  Platform.select({
    ios: initialWindowMetrics?.insets.bottom,
  }) ?? 0;

export const SAFE_AREA_PADDING = {
  paddingLeft: initialWindowMetrics?.insets.left ?? 0 + CONTENT_SPACING,
  paddingTop: initialWindowMetrics?.insets.top ?? 0 + CONTENT_SPACING,
  paddingRight: initialWindowMetrics?.insets.right ?? 0 + CONTENT_SPACING,
  paddingBottom: SAFE_BOTTOM + CONTENT_SPACING,
};

// The maximum zoom _factor_ you should be able to zoom in
export const MAX_ZOOM_FACTOR = 1;

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Platform.select<number>({
  android:
    Dimensions.get("screen").height -
    (initialWindowMetrics?.insets.bottom ?? 0),
  ios: Dimensions.get("window").height,
})!;

// Capture Button
export const CAPTURE_BUTTON_SIZE = 78;

// Control Button like Flash
export const CONTROL_BUTTON_SIZE = 40;
