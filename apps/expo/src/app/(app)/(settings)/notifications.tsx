import React, { useState } from "react";
import { Switch } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
import { Stack, styled } from "@tamagui/core";
import { Check, ChevronRight } from "@tamagui/lucide-icons";
import { createSwitch, SwitchContext } from "@tamagui/switch";
import {
  Button,
  Checkbox,
  ListItem,
  Separator,
  Text,
  View,
  XStack,
  YGroup,
  YStack,
} from "tamagui";

import { BlueSwitch } from "~/components/Switch";
import { useSession } from "~/contexts/SessionsContext";

const Notifications = () => {
  const router = useRouter();
  const { signOut, deleteAccount } = useSession();

  const isValid = true;

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$6">
      <YStack space={20}>
        <YStack space={8}>
          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem>
                <XStack
                  alignItems="center"
                  flex={1}
                  justifyContent="space-between"
                >
                  <Text>Posts</Text>
                  <BlueSwitch size="$2">
                    <BlueSwitch.Thumb animation="quick" />
                  </BlueSwitch>
                </XStack>
              </ListItem>
            </YGroup.Item>
            <YGroup.Item>
              <ListItem>
                <XStack
                  alignItems="center"
                  flex={1}
                  justifyContent="space-between"
                >
                  <Text>Mentions</Text>
                  <BlueSwitch size="$2">
                    <BlueSwitch.Thumb animation="quick" />
                  </BlueSwitch>
                </XStack>
              </ListItem>
            </YGroup.Item>
            <YGroup.Item>
              <ListItem>
                <XStack
                  alignItems="center"
                  flex={1}
                  justifyContent="space-between"
                >
                  <Text>Comments</Text>
                  <BlueSwitch size="$2">
                    <BlueSwitch.Thumb animation="quick" />
                  </BlueSwitch>
                </XStack>
              </ListItem>
            </YGroup.Item>
            <YGroup.Item>
              <ListItem>
                <XStack
                  alignItems="center"
                  flex={1}
                  justifyContent="space-between"
                >
                  <Text>Friend Requests</Text>
                  <BlueSwitch size="$2">
                    <BlueSwitch.Thumb animation="quick" />
                  </BlueSwitch>
                </XStack>
              </ListItem>
            </YGroup.Item>
          </YGroup>
        </YStack>

        <Button
          onPress={() => console.log("pressed")}
          borderWidth={0}
          pressStyle={{
            backgroundColor: "$gray12",
          }}
          disabled={!isValid}
          backgroundColor={isValid ? "white" : "$gray9"}
        >
          <Text color="black" fontSize={16} fontWeight="600">
            Save
          </Text>
        </Button>
      </YStack>
    </View>
  );
};

export default Notifications;
