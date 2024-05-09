import React from "react";
import { useLocalSearchParams } from "expo-router";
import { Text } from "tamagui";

import { ScreenBaseView } from "~/components/Views";

const EditProfile = () => {
  const { name, bio } = useLocalSearchParams<{
    name: string;
    bio: string;
  }>();

  return (
    <ScreenBaseView>
      <Text>EditProfile</Text>
    </ScreenBaseView>
  );
};

export default EditProfile;
