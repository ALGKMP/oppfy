import React from "react";

import { Stack } from "~/layouts";

const RecommendationsLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Recommendations",
        }}
      />
    </Stack>
  );
};

export default RecommendationsLayout;
