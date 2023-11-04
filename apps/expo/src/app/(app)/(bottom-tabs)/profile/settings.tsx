import React, { useState } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "@tamagui/lucide-icons";
import {
  AlertDialog,
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
      <YStack space={20}>
        <YStack space={8}>
          <Text fontSize={10} fontWeight="600" color="$gray11">
            SETTINGS
          </Text>

          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Notifications"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => router.push("profile/notifications")}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Privacy"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Other"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => router.push("profile/other")}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <YStack space={8}>
          <Text fontSize={10} fontWeight="600" color="$gray11">
            ABOUT
          </Text>

          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Share Oppfy"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Rate Oppfy"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Help"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="About"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
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
