import React, { useState } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
import { ChevronRight } from "@tamagui/lucide-icons";
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

const Privacy = () => {
  const router = useRouter();

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$6">
      <YStack space={20}>
        <YStack space={8}>
          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Blocked Users"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => router.push("profile/blocked-users")}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>
      </YStack>
    </View>
  );
};

export default Privacy;
