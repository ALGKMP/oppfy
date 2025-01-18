import { Slot } from "expo-router";
import { TamaguiProvider } from "tamagui";

import config from "../../tamagui.config";

export default function Layout() {
  console.log("Layout AppClip");
  return (
    <TamaguiProvider config={config}>
      <Slot />
    </TamaguiProvider>
  );
}
