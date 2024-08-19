import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { TamaguiProvider, View } from "tamagui";

import { PermissionsProvider } from "~/contexts/PermissionsContext";
import FontProvider from "~/providers/FontProvider";
import SentryProvider from "~/providers/SentryProvider";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";
import SessionProvider from "../contexts/SessionContext";

const RootLayout = () => {
  return (
    <SentryProvider>
      <FontProvider>
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
      </FontProvider>
    </SentryProvider>
  );
};

export default RootLayout;
