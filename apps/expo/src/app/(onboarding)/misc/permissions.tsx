import React from "react";
import { Alert, Linking } from "react-native";
import * as Camera from "expo-camera";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Check } from "@tamagui/lucide-icons";
import {
  Button,
  Checkbox,
  Separator,
  Text,
  XStack,
  YGroup,
  YStack,
} from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";

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
      ? router.push("/(app)/(bottom-tabs)/(profile)/self-profile/media-of-you")
      : router.push("/auth/phone-number");
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        "Camera Permission",
        "Camera permission is required for this app. Please enable it in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: void openSettings },
        ],
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
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: void openSettings },
        ],
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
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: void openSettings },
        ],
      );
    }
    await checkPermissions();
  };

  return (
    <BaseScreenView safeAreaEdges={["bottom"]}>
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
            <ListItem
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
            <ListItem
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
            <ListItem
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

      <Button
        onPress={onPress}
        disabled={!requiredPermissions}
        disabledStyle={{
          opacity: 0.5,
        }}
      >
        Continue
      </Button>
    </BaseScreenView>
  );
};

interface ListItemProps {
  emoji: string;
  title: string;
  subTitle: string;
  checkbox: React.ReactNode;
}

const ListItem = ({ emoji, title, subTitle, checkbox }: ListItemProps) => {
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
