import React, { useEffect, useState } from "react";
import { Linking, Platform, Share } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useActionSheet } from "@expo/react-native-action-sheet";
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

const REDIRECT_URLS = {
  askQuestion: "https://example.com/question",
  reportProblem: "https://example.com/problem",
  submitIdea: "https://example.com/submit-idea",
} as const satisfies Record<string, string>;

const Help = () => {
  const handlePress = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$6">
      <YStack space={20}>
        <YStack space={8}>
          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Ask a Question"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => handlePress(REDIRECT_URLS.askQuestion)}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <YStack space={8}>
          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Report a Problem"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => handlePress(REDIRECT_URLS.reportProblem)}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <YStack space={8}>
          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Ideas or Feedback?"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => handlePress(REDIRECT_URLS.submitIdea)}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>
      </YStack>
    </View>
  );
};

export default Help;
