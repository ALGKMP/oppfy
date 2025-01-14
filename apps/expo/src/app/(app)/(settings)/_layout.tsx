import React from "react";

import { Stack } from "~/layouts";

const SettingsLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
        }}
      />

      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />

      <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
      <Stack.Screen name="blocked" options={{ title: "Blocked Users" }} />

      <Stack.Screen name="other" options={{ title: "Other" }} />
    </Stack>
  );
};

export default SettingsLayout;
