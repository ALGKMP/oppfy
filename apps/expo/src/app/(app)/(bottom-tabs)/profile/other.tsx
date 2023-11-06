import React, { useState } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
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

const Other = () => {
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();

  const onPress = () => {
    const options = ["Clear Cache", "Cancel"];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (selectedIndex) => {
        switch (selectedIndex) {
          case destructiveButtonIndex:
            // Delete
            break;

          case cancelButtonIndex:
          // Canceled
        }
      },
    );
  };

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$6">
      <YStack space={20}>
        <YStack space={8}>
          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Clear cache"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={onPress}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <Button
          onPress={() => router.push("profile/delete-account")}
          borderWidth={0}
          backgroundColor="$gray1"
        >
          <Text color="$red9" fontSize={16} fontWeight="600">
            Delete Account
          </Text>
        </Button>
      </YStack>
    </View>
  );
};

export default Other;
