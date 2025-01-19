import React from "react";

import { Stack } from "~/components/Layouts/Navigation";

const SearchLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: "Search",
          headerShown: true,
        }}
      />
    </Stack>
  );
};

export default SearchLayout;
