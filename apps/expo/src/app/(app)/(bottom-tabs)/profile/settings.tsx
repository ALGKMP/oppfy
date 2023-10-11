import React from "react";
import { Redirect, useRouter } from "expo-router";
import { Button, Text, View } from "tamagui";

import { useSession } from "~/contexts/SessionsContext";

const Settings = () => {
  const router = useRouter();
  const { signOut, deleteAccount } = useSession();

  return (
    <View flex={1} backgroundColor="black">
      <Button onPress={signOut}>Logout</Button>

      <Button theme="red" onPress={deleteAccount}>Delete Account</Button>
    </View>
  );
};

export default Settings;
