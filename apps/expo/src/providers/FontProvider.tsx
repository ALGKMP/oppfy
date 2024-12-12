import type { ReactNode } from "react";
import React from "react";
import { useFonts } from "expo-font";
import { Modak_400Regular } from "@expo-google-fonts/modak";
import Inter_900Black from "@tamagui/font-inter/otf/Inter-Black.otf";
import Inter_700Bold from "@tamagui/font-inter/otf/Inter-Bold.otf";
import Inter_800ExtraBold from "@tamagui/font-inter/otf/Inter-ExtraBold.otf";
import Inter_200ExtraLight from "@tamagui/font-inter/otf/Inter-ExtraLight.otf";
import Inter_300Light from "@tamagui/font-inter/otf/Inter-Light.otf";
import Inter_400Regular from "@tamagui/font-inter/otf/Inter-Medium.otf";
import Inter_500Medium from "@tamagui/font-inter/otf/Inter-Medium.otf";
import Inter_600SemiBold from "@tamagui/font-inter/otf/Inter-SemiBold.otf";
import Inter_100Thin from "@tamagui/font-inter/otf/Inter-Thin.otf";

interface FontProviderProps {
  children: ReactNode;
}

const FontProvider = ({ children }: FontProviderProps) => {
  const [fontsLoaded] = useFonts({
    Modak: Modak_400Regular,
    InterThin: Inter_100Thin,
    InterExtraLight: Inter_200ExtraLight,
    InterLight: Inter_300Light,
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
    InterExtraBold: Inter_800ExtraBold,
    InterBlack: Inter_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <>{children}</>;
};

export { FontProvider };
