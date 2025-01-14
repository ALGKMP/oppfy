import React from "react";

import { Stack } from "~/layouts";

const CreatePostLayout = () => (
  <Stack>
    <Stack.Screen
      name="preview"
      options={{
        header: () => null,
        animation: "fade",
      }}
    />
    <Stack.Screen
      name="post-to"
      options={{
        title: "Post To",
      }}
    />
    <Stack.Screen
      name="create-post"
      options={{
        title: "Create Post",
      }}
    />
  </Stack>
);

export default CreatePostLayout;
