import React from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
import { ChevronRight } from "@tamagui/lucide-icons";
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
              <ListItem
                title="Posts"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Mentions"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Comments"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Friend requests"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
              />
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
