import React from "react";
import { Alert, Linking } from "react-native";
import * as Camera from "expo-camera";
import * as Contacts from "expo-contacts";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Check } from "@tamagui/lucide-icons";
import {
  Button,
  Checkbox,
  Separator,
  Text,
  View,
  XStack,
  YGroup,
  YStack,
} from "tamagui";

import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionsContext";

const Permissions = () => {
  const router = useRouter();

  const { isSignedIn } = useSession();
  const { permissions, checkPermissions } = usePermissions();

  const requiredPermissions = permissions.camera && permissions.contacts;

  const openSettings = async () => {
    await Linking.openSettings();
  };

  const onPress = () => {
    isSignedIn
      ? router.push("/(app)/(bottom-tabs)/profile")
      : router.push("/auth/phone-number");
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        "Camera Permission",
        "Camera permission is required for this app. Please enable it in your device settings.",
        [{ text: "Open Settings", onPress: void openSettings }],
      );
    }
    await checkPermissions();
  };

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        "Contacts Permission",
        "Contacts permission is required for this app. Please enable it in your device settings.",
        [{ text: "Open Settings", onPress: void openSettings }],
      );
    }
    await checkPermissions();
  };

  const requestNotificationsPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        "Notifications Permission",
        "Notifications permission is required for this app. Please enable it in your device settings.",
        [{ text: "Open Settings", onPress: void openSettings }],
      );
    }
    await checkPermissions();
  };

  return (
    <View flex={1} padding="$4" backgroundColor="$background">
      <YStack flex={1} gap="$8">
        <Text
          alignSelf="center"
          textAlign="center"
          color="$gray9"
          fontWeight="bold"
        >
          We&apos;ll just need a few permissions to get started.
        </Text>

        <YGroup gap="$4">
          <YGroup.Item>
            <PermissionListItem
              emoji="📸"
              title="Camera"
              subTitle="So you can take and upload photos of your friends"
              checkbox={
                <Checkbox
                  size="$6"
                  onPress={requestCameraPermission}
                  checked={permissions.camera}
                  disabled={permissions.camera}
                >
                  <Checkbox.Indicator>
                    <Check />
                  </Checkbox.Indicator>
                </Checkbox>
              }
            />
          </YGroup.Item>

          <Separator />

          <YGroup.Item>
            <PermissionListItem
              emoji="📱"
              title="Contacts"
              subTitle="So you can find your friends and your friends can find you"
              checkbox={
                <Checkbox
                  size="$6"
                  onPress={requestContactsPermission}
                  checked={permissions.contacts}
                  disabled={permissions.contacts}
                >
                  <Checkbox.Indicator>
                    <Check />
                  </Checkbox.Indicator>
                </Checkbox>
              }
            />
          </YGroup.Item>

          <Separator />

          <YGroup.Item>
            <PermissionListItem
              emoji="🔔"
              title="Notifications"
              subTitle="So you know when your friends have snapped a pic of you"
              checkbox={
                <Checkbox
                  size="$6"
                  onPress={requestNotificationsPermission}
                  checked={permissions.notifications}
                  disabled={permissions.notifications}
                >
                  <Checkbox.Indicator>
                    <Check />
                  </Checkbox.Indicator>
                </Checkbox>
              }
            />
          </YGroup.Item>
        </YGroup>
      </YStack>

      <Button onPress={onPress} disabled={!requiredPermissions}>
        Continue
      </Button>
    </View>
  );
};

interface PermissionListItemProps {
  emoji: string;
  title: string;
  subTitle: string;
  checkbox: React.ReactNode;
}

const PermissionListItem = ({
  emoji,
  title,
  subTitle,
  checkbox,
}: PermissionListItemProps) => {
  return (
    <XStack alignItems="center" gap="$2">
      <Text fontSize="$10">{emoji}</Text>

      <YStack flex={1} gap>
        <Text fontSize="$7" fontWeight="bold">
          {title}
        </Text>
        <Text color="$gray9">{subTitle}</Text>
      </YStack>

      {checkbox}
    </XStack>
  );
};

export default Permissions;
