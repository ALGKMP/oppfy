import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Redirect, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import ChivoMonoBlack from "@assets/fonts/ChivoMono/ChivoMono-Black.ttf";
import ChivoMonoBlackItalic from "@assets/fonts/ChivoMono/ChivoMono-BlackItalic.ttf";
import ChivoMonoBold from "@assets/fonts/ChivoMono/ChivoMono-Bold.ttf";
import ChivoMonoBoldItalic from "@assets/fonts/ChivoMono/ChivoMono-BoldItalic.ttf";
import ChivoMonoExtraBold from "@assets/fonts/ChivoMono/ChivoMono-ExtraBold.ttf";
import ChivoMonoExtraBoldItalic from "@assets/fonts/ChivoMono/ChivoMono-ExtraBoldItalic.ttf";
import ChivoMonoExtraLight from "@assets/fonts/ChivoMono/ChivoMono-ExtraLight.ttf";
import ChivoMonoExtraLightItalic from "@assets/fonts/ChivoMono/ChivoMono-ExtraLightItalic.ttf";
import ChivoMonoRegularItalic from "@assets/fonts/ChivoMono/ChivoMono-Italic.ttf";
import ChivoMonoLight from "@assets/fonts/ChivoMono/ChivoMono-Light.ttf";
import ChivoMonoLightItalic from "@assets/fonts/ChivoMono/ChivoMono-LightItalic.ttf";
import ChivoMonoMedium from "@assets/fonts/ChivoMono/ChivoMono-Medium.ttf";
import ChivoMonoMediumItalic from "@assets/fonts/ChivoMono/ChivoMono-MediumItalic.ttf";
import ChivoMonoRegular from "@assets/fonts/ChivoMono/ChivoMono-Regular.ttf";
import ChivoMonoSemiBold from "@assets/fonts/ChivoMono/ChivoMono-SemiBold.ttf";
import ChivoMonoSemiBoldItalic from "@assets/fonts/ChivoMono/ChivoMono-SemiBoldItalic.ttf";
import ChivoMonoThin from "@assets/fonts/ChivoMono/ChivoMono-Thin.ttf";
import ChivoMonoThinItalic from "@assets/fonts/ChivoMono/ChivoMono-ThinItalic.ttf";
import SpartanBlack from "@assets/fonts/Spartan/Spartan-Black.ttf";
import SpartanBold from "@assets/fonts/Spartan/Spartan-Bold.ttf";
import SpartanExtraBold from "@assets/fonts/Spartan/Spartan-ExtraBold.ttf";
import SpartanExtraLight from "@assets/fonts/Spartan/Spartan-ExtraLight.ttf";
import SpartanLight from "@assets/fonts/Spartan/Spartan-Light.ttf";
import SpartanMedium from "@assets/fonts/Spartan/Spartan-Medium.ttf";
import SpartanRegular from "@assets/fonts/Spartan/Spartan-Regular.ttf";
import SpartanSemiBold from "@assets/fonts/Spartan/Spartan-SemiBold.ttf";
import SpartanThin from "@assets/fonts/Spartan/Spartan-Thin.ttf";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import auth from "@react-native-firebase/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider, Text, View } from "tamagui";

import { TRPCProvider } from "~/utils/api";
import { LoadingIndicatorOverlay } from "~/components/Overlays";
import tamaguiConfig from "~/../tamagui.config";
import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { Stack } from "~/layouts";
import SessionProvider from "../contexts/SessionsContext";

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    "ChivoMono-Thin": ChivoMonoThin,
    "ChivoMono-ThinItalic": ChivoMonoThinItalic,
    "ChivoMono-ExtraLight": ChivoMonoExtraLight,
    "ChivoMono-ExtraLightItalic": ChivoMonoExtraLightItalic,
    "ChivoMono-Light": ChivoMonoLight,
    "ChivoMono-LightItalic": ChivoMonoLightItalic,
    "ChivoMono-Regular": ChivoMonoRegular,
    "ChivoMono-RegularItalic": ChivoMonoRegularItalic,
    "ChivoMono-Medium": ChivoMonoMedium,
    "ChivoMono-MediumItalic": ChivoMonoMediumItalic,
    "ChivoMono-SemiBold": ChivoMonoSemiBold,
    "ChivoMono-SemiBoldItalic": ChivoMonoSemiBoldItalic,
    "ChivoMono-Bold": ChivoMonoBold,
    "ChivoMono-BoldItalic": ChivoMonoBoldItalic,
    "ChivoMono-ExtraBold": ChivoMonoExtraBold,
    "ChivoMono-ExtraBoldItalic": ChivoMonoExtraBoldItalic,
    "ChivoMono-Black": ChivoMonoBlack,
    "ChivoMono-BlackItalic": ChivoMonoBlackItalic,
  });

  if (!fontsLoaded) {
    return <LoadingIndicatorOverlay />;
  }

  const queryClient = new QueryClient();

  return (
    <TRPCProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <PermissionsProvider>
            <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
              <ActionSheetProvider>
                <SafeAreaProvider>
                  <View flex={1} backgroundColor="black">
                    <Slot />
                    <StatusBar />
                  </View>
                </SafeAreaProvider>
              </ActionSheetProvider>
            </TamaguiProvider>
          </PermissionsProvider>
        </SessionProvider>
      </QueryClientProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
