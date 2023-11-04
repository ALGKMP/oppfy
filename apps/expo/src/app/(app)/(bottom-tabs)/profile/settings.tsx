import React from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
import {
  Button,
  ListItem,
  Separator,
  Text,
  View,
  YGroup,
  YStack,
} from "tamagui";

import { useSession } from "~/contexts/SessionsContext";

const Settings = () => {
  const router = useRouter();
  const { signOut, deleteAccount } = useSession();

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$6">
      {/* <Button onPress={signOut}>Logout</Button>

      <Button theme="red" onPress={deleteAccount}>Delete Account</Button> */}

      <YStack space={20}>
        <YStack space={8}>
          <Text fontSize={10} fontWeight="600" color="$gray11">
            SETTINGS
          </Text>

          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem hoverTheme pressTheme title="Notifications" />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem hoverTheme pressTheme title="Privacy" />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem hoverTheme pressTheme title="Other" />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <YStack space={8}>
          <Text fontSize={10} fontWeight="600" color="$gray11">
            ABOUT
          </Text>

          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem hoverTheme pressTheme title="Share Oppfy" />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem hoverTheme pressTheme title="Rate Oppfy" />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem hoverTheme pressTheme title="Help" />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem hoverTheme pressTheme title="About" />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <Button onPress={signOut} backgroundColor="$gray1">
          <Text color="$red9" fontSize={16} fontWeight="600">
            Log Out
          </Text>
        </Button>
      </YStack>
    </View>
  );
};

export default Settings;
