import React from "react";
import { Redirect, useRouter } from "expo-router";
import { Button, Text, View } from "tamagui";

import useLogout from "~/hooks/useLogout";

const Settings = () => {
  const router = useRouter();
  const logout = useLogout();

  return (
    <View flex={1} backgroundColor="black">
      {/* <Text>Settings</Text> */}
      <Button onPress={logout}>Logout</Button>
    </View>
  );
};

export default Settings;
