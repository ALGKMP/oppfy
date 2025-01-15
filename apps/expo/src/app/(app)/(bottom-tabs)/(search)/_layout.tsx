import React from "react";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack/";
import { Text, useTheme } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { Stack } from "~/layouts";

// import { Stack } from "expo-router";

const SearchLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Search",
        }}
      />
    </Stack>
  );
};

export default SearchLayout;
