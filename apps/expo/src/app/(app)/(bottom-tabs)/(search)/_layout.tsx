import React from "react";

import { Stack } from "~/components/Layouts/Navigation";

const SearchLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Search",
        }}
      />

      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="self-profile" options={{ headerShown: false }} />
    </Stack>
  );
};

export default SearchLayout;
