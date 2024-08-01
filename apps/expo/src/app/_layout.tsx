import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isRunningInExpoGo } from "expo";
import { useFonts } from "expo-font";
import { Slot, useNavigationContainerRef } from "expo-router";
import { Modak_400Regular } from "@expo-google-fonts/modak";
import * as Sentry from "@sentry/react-native";
import Inter_900Black from "@tamagui/font-inter/otf/Inter-Black.otf";
import Inter_700Bold from "@tamagui/font-inter/otf/Inter-Bold.otf";
import Inter_800ExtraBold from "@tamagui/font-inter/otf/Inter-ExtraBold.otf";
import Inter_200ExtraLight from "@tamagui/font-inter/otf/Inter-ExtraLight.otf";
import Inter_300Light from "@tamagui/font-inter/otf/Inter-Light.otf";
import Inter_400Regular from "@tamagui/font-inter/otf/Inter-Medium.otf";
import Inter_500Medium from "@tamagui/font-inter/otf/Inter-Medium.otf";
import Inter_600SemiBold from "@tamagui/font-inter/otf/Inter-SemiBold.otf";
import Inter_100Thin from "@tamagui/font-inter/otf/Inter-Thin.otf";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { TamaguiProvider, View } from "tamagui";


import { env } from "@oppfy/env";

import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";
import SessionProvider from "../contexts/SessionContext";

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

console.log("IS RUNNING IN expo GO", isRunningInExpoGo());

Sentry.init({
  dsn: env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  integrations: [
    new Sentry.ReactNativeTracing({
      // Pass instrumentation to be used as `routingInstrumentation`
      routingInstrumentation,
      enableNativeFramesTracking: !isRunningInExpoGo(),
      // ...
    }),
  ],
});

const RootLayout = () => {
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

  // Capture the NavigationContainer ref and register it with the instrumentation.
  const ref = useNavigationContainerRef();

  React.useEffect(() => {
    if (ref) {
      routingInstrumentation.registerNavigationContainer(ref);
    }
  }, [ref]);

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
                <ToastProvider>
                  <View flex={1} backgroundColor="$background">
                    <Slot />
                  </View>
                  <ToastViewport />
                </ToastProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </PermissionsProvider>
        </SessionProvider>
      </TamaguiProvider>
    </TRPCProvider>
  );
};

export default Sentry.wrap(RootLayout);
