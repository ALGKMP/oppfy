import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { TamaguiProvider, View } from "tamagui";

import { PermissionsProvider } from "~/contexts/PermissionsContext";
import FontProvider from "~/providers/FontProvider";
import SentryProvider from "~/providers/SentryProvider";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";
import SessionProvider from "../contexts/SessionContext";
import { AudioProvider } from "~/contexts/AudioContext";

const RootLayout = () => {
  return (
    <SentryProvider>
      <FontProvider>
        <TRPCProvider>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
            <SessionProvider>
              <PermissionsProvider>
                <AudioProvider>
                  <SafeAreaProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <BottomSheetModalProvider>
                        <ToastProvider native={true}>
                          <View flex={1} backgroundColor="$background">
                            <Slot />
                          </View>
                          <ToastViewport />
                        </ToastProvider>
                      </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                  </SafeAreaProvider>
                </AudioProvider>
              </PermissionsProvider>
            </SessionProvider>
          </TamaguiProvider>
        </TRPCProvider>
      </FontProvider>
    </SentryProvider>
  );
};

export default RootLayout;
