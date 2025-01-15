import React from "react";

import useProfile from "~/hooks/useProfile";
import { Stack } from "~/layouts";

const SelfProfileLayout = () => {
  const { data: profile } = useProfile();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="connections"
        options={{ title: profile?.username ?? "" }}
      />
    </Stack>
  );
};

export default SelfProfileLayout;
