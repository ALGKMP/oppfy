import React from "react";

import { Stack } from "~/components/Layouts/Navigation";

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
