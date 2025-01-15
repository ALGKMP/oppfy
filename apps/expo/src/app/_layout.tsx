import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { PortalProvider, TamaguiProvider } from "tamagui";

import {
  ActionSheetProvider,
  AlertDialogProvider,
  DialogProvider,
} from "~/components/ui";
import { BottomSheetProvider } from "~/components/ui/BottomSheet";
import { AudioProvider } from "~/contexts/AudioContext";
import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { SessionProvider } from "~/contexts/SessionContext";
import { FontProvider } from "~/providers/FontProvider";
import { SentryProvider } from "~/providers/SentryProvider";
import { DARK_THEME } from "~/theme";
import { TRPCProvider } from "~/utils/api";
import { isAppClip } from "~/utils/appClip";
import tamaguiConfig from "../../tamagui.config";

const RootLayout = () => {
  if (isAppClip()) {
    return (
      <Stack>
        <Stack.Screen name="clip" options={{ title: "Quick Access" }} />
      </Stack>
    );
  }

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
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <PortalProvider>
                          <BottomSheetModalProvider>
                            <ActionSheetProvider>
                              <AlertDialogProvider>
                                <DialogProvider>
                                  <ToastProvider native={true}>
                                    <BottomSheetProvider>
                                      <StatusBar style="auto" />
                                      <Slot />
                                      <ToastViewport />
                                    </BottomSheetProvider>
                                  </ToastProvider>
                                </DialogProvider>
                              </AlertDialogProvider>
                            </ActionSheetProvider>
                          </BottomSheetModalProvider>
                        </PortalProvider>
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
