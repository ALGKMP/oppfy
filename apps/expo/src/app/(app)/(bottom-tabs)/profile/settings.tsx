import React from "react";
import { Redirect, useRouter } from "expo-router";
import { Button, Text, View } from "tamagui";

import { useSession } from "~/contexts/SessionsContext";

const Settings = () => {
  const router = useRouter();
  const { signOut } = useSession();

  return (
    <View flex={1} backgroundColor="black">
      {/* <Text>Settings</Text> */}
      <Button onPress={signOut}>Logout</Button>
    </View>
  );
};

export default Settings;
