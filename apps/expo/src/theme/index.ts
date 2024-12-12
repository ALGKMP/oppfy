import { Theme } from "@react-navigation/native";

export const NAV_THEME = {
  background: "hsl(240 10% 3.9%)", // background
  border: "hsl(240 3.7% 15.9%)", // border
  card: "hsl(240 10% 3.9%)", // card
  notification: "hsl(0 72% 51%)", // destructive
  primary: "hsl(0 0% 98%)", // primary
  text: "hsl(0 0% 98%)", // foreground
};

export const DARK_THEME: Theme = {
  dark: true,
  colors: NAV_THEME,
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "900",
    },
  },
}; 