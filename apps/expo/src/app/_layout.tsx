// import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Theme, ThemeProvider } from "@react-navigation/native";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { TamaguiProvider, View } from "tamagui";

import { AudioProvider } from "~/contexts/AudioContext";
import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { SessionProvider } from "~/contexts/SessionContext";
import { FontProvider } from "~/providers/FontProvider";
import { SentryProvider } from "~/providers/SentryProvider";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";

export const NAV_THEME = {
  background: "hsl(240 10% 3.9%)", // background
  border: "hsl(240 3.7% 15.9%)", // border
  card: "hsl(240 10% 3.9%)", // card
  notification: "hsl(0 72% 51%)", // destructive
  primary: "hsl(0 0% 98%)", // primary
  text: "hsl(0 0% 98%)", // foreground
};

const DARK_THEME: Theme = {
  dark: true,
  colors: NAV_THEME,
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "900",
    },
  },
};

// const RootLayout = () => {
//   return (
//     <TRPCProvider>
//       <ThemeProvider value={DARK_THEME}>
//         <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
//           <StatusBar style="light" />
//           <Stack>
//             <Stack.Screen name="index" />
//           </Stack>
//         </TamaguiProvider>
//       </ThemeProvider>
//     </TRPCProvider>
//   );
// };
const RootLayout = () => {
  return (
    <SentryProvider>
      <FontProvider>
        <TRPCProvider>
          <ThemeProvider value={DARK_THEME}>
            <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
              <SessionProvider>
                <PermissionsProvider>
                  <AudioProvider>
                    <SafeAreaProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <BottomSheetModalProvider>
                          <ToastProvider native={true}>
                            <StatusBar style="dark" />
                            <Slot />

                            {/* <Stack>
                              <Stack.Screen name="index" />
                            </Stack> */}
                            <ToastViewport />
                          </ToastProvider>
                        </BottomSheetModalProvider>
                      </GestureHandlerRootView>
                    </SafeAreaProvider>
                  </AudioProvider>
                </PermissionsProvider>
              </SessionProvider>
            </TamaguiProvider>
          </ThemeProvider>
        </TRPCProvider>
      </FontProvider>
    </SentryProvider>
  );
};

export default RootLayout;
