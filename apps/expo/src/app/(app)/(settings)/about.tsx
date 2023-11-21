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
  termsOfService: "https://example.com/terms-of-service",
  privacyPolicy: "https://example.com/privacy-policy",
  joinUs: "https://example.com/join-us",
} as const satisfies Record<string, string>;

const About = () => {
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
                title="Terms of Service"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => handlePress(REDIRECT_URLS.termsOfService)}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <YStack space={8}>
          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Privacy Policy"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => handlePress(REDIRECT_URLS.privacyPolicy)}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <YStack space={8}>
          <YGroup separator={<Separator />}>
            <YGroup.Item>
              <ListItem
                title="Join Us"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => handlePress(REDIRECT_URLS.joinUs)}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>
      </YStack>
    </View>
  );
};

export default About;
