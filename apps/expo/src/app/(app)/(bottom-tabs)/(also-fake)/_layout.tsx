import { Slot, Stack } from "expo-router";
import { Screen } from "expo-router/build/views/Screen";
import { View } from "tamagui";

import Page from "./page";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="page" />
      <Stack.Screen name="more-shit/page" />
    </Stack>
  );
}
