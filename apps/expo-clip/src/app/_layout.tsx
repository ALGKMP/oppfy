import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { TamaguiProvider, Theme } from "tamagui";

import config from "../../tamagui.config";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config}>
        <Theme name="light">
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </Theme>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
