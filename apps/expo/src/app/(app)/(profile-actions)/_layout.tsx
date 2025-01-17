import React from "react";

import { Stack } from "~/components/Layouts/Navigation";

const ProfileActionsLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="edit-profile"
        options={{
          title: "Edit Profile",
        }}
      />
      <Stack.Screen
        name="share-profile"
        options={{
          header: () => null,
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
};

export default ProfileActionsLayout;
