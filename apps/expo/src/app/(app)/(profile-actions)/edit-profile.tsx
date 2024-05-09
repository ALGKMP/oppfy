import React from "react";
import { SearchParams, useLocalSearchParams } from "expo-router";
import { Text } from "tamagui";

import { ScreenBaseView } from "~/components/Views";
import useParams from "~/hooks/useParams";

export interface EditProfileParams {
  name: string;
  bio?: string;
}

const EditProfile = () => {
  // const signUpFlowParams = useParams<EditProfileParams>();
  const thing = useLocalSearchParams<{
    name: string;
    bio?: string;
  }>();

  return (
    <ScreenBaseView>
      <Text>EditProfile</Text>
    </ScreenBaseView>
  );
};

export default EditProfile;
