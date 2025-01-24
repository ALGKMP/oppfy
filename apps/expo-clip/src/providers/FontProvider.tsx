import type { ReactNode } from "react";
import React from "react";
import { useFonts } from "expo-font";
import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { Modak_400Regular } from "@expo-google-fonts/modak";

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
