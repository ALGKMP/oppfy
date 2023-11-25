import React, { useState } from "react";
import { Linking, Platform, Share } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
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

import { useSession } from "~/contexts/SessionsContext";

const ITUNES_ITEM_ID = 982107779;
const ANDROID_PACKAGE_NAME = "host.exp.exponent";

const Settings = () => {
  const router = useRouter();

  const { signOut, deleteAccount } = useSession();
  const { showActionSheetWithOptions } = useActionSheet();

  const onPress = () => {
    const options = ["Log Out", "Cancel"];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      async (selectedIndex) => {
        switch (selectedIndex) {
          case destructiveButtonIndex:
            // Delete
            await signOut();
            break;

          case cancelButtonIndex:
          // Canceled
        }
      },
    );
  };

  const openStoreForReview = async () => {
    if (Platform.OS === "ios") {
      await Linking.openURL(
        `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${ITUNES_ITEM_ID}?action=write-review`,
      );
    } else if (Platform.OS === "android") {
      await Linking.openURL(
        `market://details?id=${ANDROID_PACKAGE_NAME}&showAllReviews=true`,
      );
    }
  };

  const handleShare = async () => {
    try {
      // TODO: update share message
      await Share.share({
        title: "Share Oppfy",
        message: "Check out Oppfy, it's a great app!",
        // Optionally, you can add a URL to share:
        // url: 'https://yourappurl.com'
      });
    } catch (error) {
      alert("Error sharing, try again later.");
    }
  };

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
                onPress={() => router.push("notifications")}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Privacy"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => router.push("privacy")}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Other"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => router.push("other")}
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
                onPress={handleShare}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Rate Oppfy"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={openStoreForReview}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="Help"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => router.push("help")}
              />
            </YGroup.Item>
            <YGroup.Item>
              <ListItem
                title="About"
                hoverTheme
                pressTheme
                iconAfter={ChevronRight}
                onPress={() => router.push("about")}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>

        <Button onPress={onPress} backgroundColor="$gray1">
          <Text color="$red9" fontSize={16} fontWeight="600">
            Log Out
          </Text>
        </Button>
      </YStack>
    </View>
  );
};

export default Settings;
