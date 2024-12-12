import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { TamaguiProvider } from "tamagui";

import { AudioProvider } from "~/contexts/AudioContext";
import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { SessionProvider } from "~/contexts/SessionContext";
import { FontProvider } from "~/providers/FontProvider";
import { SentryProvider } from "~/providers/SentryProvider";
import { DARK_THEME } from "~/theme";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";

const RootLayout = () => {
  return (
    <SentryProvider>
      <TRPCProvider>
        <ThemeProvider value={DARK_THEME}>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
            <FontProvider>
              <SessionProvider>
                <PermissionsProvider>
                  <AudioProvider>
                    <SafeAreaProvider>
                      <GestureHandlerRootView>
                        <BottomSheetModalProvider>
                          <ToastProvider native={true}>
                            <StatusBar style="dark" />
                            <Slot />
                            <ToastViewport />
                          </ToastProvider>
                        </BottomSheetModalProvider>
                      </GestureHandlerRootView>
                    </SafeAreaProvider>
                  </AudioProvider>
                </PermissionsProvider>
              </SessionProvider>
            </FontProvider>
          </TamaguiProvider>
        </ThemeProvider>
      </TRPCProvider>
    </SentryProvider>
  );
};

export default RootLayout;
