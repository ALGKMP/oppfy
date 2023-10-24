import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Redirect, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import SpartanBlack from "@assets/fonts/Spartan/Spartan-Black.ttf";
import SpartanBold from "@assets/fonts/Spartan/Spartan-Bold.ttf";
import SpartanExtraBold from "@assets/fonts/Spartan/Spartan-ExtraBold.ttf";
import SpartanExtraLight from "@assets/fonts/Spartan/Spartan-ExtraLight.ttf";
import SpartanLight from "@assets/fonts/Spartan/Spartan-Light.ttf";
import SpartanMedium from "@assets/fonts/Spartan/Spartan-Medium.ttf";
import SpartanRegular from "@assets/fonts/Spartan/Spartan-Regular.ttf";
import SpartanSemiBold from "@assets/fonts/Spartan/Spartan-SemiBold.ttf";
import SpartanThin from "@assets/fonts/Spartan/Spartan-Thin.ttf";
import auth from "@react-native-firebase/auth";
import { TamaguiProvider, Text, View } from "tamagui";

import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "~/../tamagui.config";
import { Stack } from "~/layouts";
import SessionProvider from "../contexts/SessionsContext";

const RootLayout = () => {
  const [loaded] = useFonts({
    SpartanThin,
    SpartanExtraLight,
    SpartanLight,
    SpartanRegular,
    SpartanMedium,
    SpartanSemiBold,
    SpartanBold,
    SpartanExtraBold,
    SpartanBlack,
  });

  useEffect(() => {
    if (loaded) {
      // can hide splash screen here
      console.log("loaded fonts");
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <TRPCProvider>
      <SessionProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
          <SafeAreaProvider>
            <View flex={1} backgroundColor="$backgroundStrong">
              {/* <Stack
                screenOptions={{
                  headerShown: false,
                }}
              /> */}
              <Slot />
              <StatusBar />
            </View>
          </SafeAreaProvider>
        </TamaguiProvider>
      </SessionProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
