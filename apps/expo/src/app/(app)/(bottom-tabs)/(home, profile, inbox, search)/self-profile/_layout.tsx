import React from "react";

import { Stack } from "~/layouts";

const SelfProfileLayout = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
  </Stack>
);

export default SelfProfileLayout;
