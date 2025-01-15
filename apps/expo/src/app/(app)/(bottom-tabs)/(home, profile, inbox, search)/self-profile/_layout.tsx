import React from "react";

import { Stack } from "~/layouts";

const SelfProfileLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="index" />
    <Stack.Screen name="connections" />
  </Stack>
);

export default SelfProfileLayout;
