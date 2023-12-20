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
import {
  ChivoMono_100Thin,
  ChivoMono_100Thin_Italic,
  ChivoMono_200ExtraLight,
  ChivoMono_200ExtraLight_Italic,
  ChivoMono_300Light,
  ChivoMono_300Light_Italic,
  ChivoMono_400Regular,
  ChivoMono_400Regular_Italic,
  ChivoMono_500Medium,
  ChivoMono_500Medium_Italic,
  ChivoMono_600SemiBold,
  ChivoMono_600SemiBold_Italic,
  ChivoMono_700Bold,
  ChivoMono_700Bold_Italic,
  ChivoMono_800ExtraBold,
  ChivoMono_800ExtraBold_Italic,
  ChivoMono_900Black,
  ChivoMono_900Black_Italic,
} from "@expo-google-fonts/chivo-mono";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import auth from "@react-native-firebase/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider, Text, View } from "tamagui";

import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { Stack } from "~/layouts";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";
import SessionProvider from "../contexts/SessionsContext";

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    "ChivoMono-Thin": ChivoMono_100Thin,
    "ChivoMono-ThinItalic": ChivoMono_100Thin_Italic,
    "ChivoMono-ExtraLight": ChivoMono_200ExtraLight,
    "ChivoMono-ExtraLightItalic": ChivoMono_200ExtraLight_Italic,
    "ChivoMono-Light": ChivoMono_300Light,
    "ChivoMono-LightItalic": ChivoMono_300Light_Italic,
    "ChivoMono-Regular": ChivoMono_400Regular,
    "ChivoMono-RegularItalic": ChivoMono_400Regular_Italic,
    "ChivoMono-Medium": ChivoMono_500Medium,
    "ChivoMono-MediumItalic": ChivoMono_500Medium_Italic,
    "ChivoMono-SemiBold": ChivoMono_600SemiBold,
    "ChivoMono-SemiBoldItalic": ChivoMono_600SemiBold_Italic,
    "ChivoMono-Bold": ChivoMono_700Bold,
    "ChivoMono-BoldItalic": ChivoMono_700Bold_Italic,
    "ChivoMono-ExtraBold": ChivoMono_800ExtraBold,
    "ChivoMono-ExtraBoldItalic": ChivoMono_800ExtraBold_Italic,
    "ChivoMono-Black": ChivoMono_900Black,
    "ChivoMono-BlackItalic": ChivoMono_900Black_Italic,
  });

  if (!fontsLoaded) {
    return null;
  }

  const queryClient = new QueryClient();

  return (
    <TRPCProvider>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
          <SessionProvider>
            <PermissionsProvider>
              <ActionSheetProvider>
                <SafeAreaProvider>
                  <View flex={1} backgroundColor="black">
                    <Slot />
                    <StatusBar />
                  </View>
                </SafeAreaProvider>
              </ActionSheetProvider>
            </PermissionsProvider>
          </SessionProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
