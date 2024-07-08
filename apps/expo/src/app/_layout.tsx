import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
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
import { TamaguiProvider, View } from "tamagui";

import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { useNotificationObserver } from "~/hooks/notifications";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";
import SessionProvider from "../contexts/SessionContext";

const RootLayout = () => {
  useNotificationObserver();

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

  return (
    <TRPCProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <SessionProvider>
          <PermissionsProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <View flex={1} backgroundColor="$background">
                  <Slot />
                </View>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </PermissionsProvider>
        </SessionProvider>
      </TamaguiProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
