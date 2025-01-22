import { Slot } from "expo-router";
import { TamaguiProvider } from "tamagui";
import { FontProvider } from "../providers/FontProvider";

import config from "../../tamagui.config";

export default function Layout() {
  return (
    <TamaguiProvider config={config}>
      <FontProvider>
        <Slot />
      </FontProvider>
    </TamaguiProvider>
  );
}
