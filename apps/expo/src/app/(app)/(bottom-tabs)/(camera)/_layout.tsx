import { Slot } from "expo-router";

import { Stack } from "~/layouts";

const CameraLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="index" />
    <Stack.Screen
      name="(media-picker)"
      options={{
        presentation: "modal",
      }}
    />
  </Stack>
);

export default CameraLayout;
