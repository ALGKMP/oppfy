import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Check, Info } from "@tamagui/lucide-icons";

import {
  Checkbox,
  Group,
  H3,
  H4,
  OnboardingButton,
  Paragraph,
  ScreenView,
  Separator,
  Text,
  useAlertDialogController,
  useDialogController,
  XStack,
  YStack,
} from "~/components/ui";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";

type PermissionType = "Camera" | "Contacts" | "Notifications";

const Permissions = () => {
  const router = useRouter();
  const { isSignedIn } = useSession();
  const { permissions, checkPermissions } = usePermissions();

  const alertDialog = useAlertDialogController();
  const learnMoreDialog = useDialogController();

  const requiredPermissions = permissions.camera && permissions.contacts;

  const openSettings = async (): Promise<void> => {
    await Linking.openSettings();
  };

  const onPress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isSignedIn
      ? router.push("/(app)/(bottom-tabs)/(home)")
      : router.push("/firebaseauth/link");
  };

  const showPermissionAlert = async (permissionType: PermissionType) => {
    const confirmed = await alertDialog.show({
      title: `${permissionType} Permission`,
      subtitle: `Oppfy uses ${permissionType} to offer users the best experience. You can enable or disable this permission at any time in the settings.`,
      cancelText: "OK",
      acceptText: "Settings",
    });

    if (confirmed) {
      void openSettings();
    }
  };

  const handlePermissionRequest = async (
    permissionType: PermissionType,
    requestFunction: () => Promise<{
      status: PermissionStatus;
      canAskAgain: boolean;
    }>,
    getStatusFunction: () => Promise<{
      status: PermissionStatus;
      canAskAgain: boolean;
    }>,
  ): Promise<void> => {
    const { canAskAgain, status } = await getStatusFunction();

    if (status !== PermissionStatus.GRANTED && canAskAgain) {
      try {
        await requestFunction();
        await checkPermissions();
      } catch (error) {
        void showPermissionAlert(permissionType);
      }
    } else {
      void showPermissionAlert(permissionType);
    }
  };

  const requestCameraPermission = (): Promise<void> =>
    handlePermissionRequest(
      "Camera",
      ImagePicker.requestCameraPermissionsAsync,
      ImagePicker.getCameraPermissionsAsync,
    );

  const requestContactsPermission = (): Promise<void> =>
    handlePermissionRequest(
      "Contacts",
      Contacts.requestPermissionsAsync,
      Contacts.getPermissionsAsync,
    );

  const requestNotificationsPermission = (): Promise<void> =>
    handlePermissionRequest(
      "Notifications",
      Notifications.requestPermissionsAsync,
      Notifications.getPermissionsAsync,
    );

  return (
    <ScreenView
      paddingBottom={0}
      safeAreaEdges={["bottom"]}
      justifyContent="space-between"
    >
      <YStack flex={1} gap="$6">
        <H3 textAlign="center">
          We'll just need a few permissions to get started.
        </H3>

        <Group orientation="vertical" gap="$4">
          <Group.Item>
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
              underText={
                <TouchableOpacity
                  onPress={() => {
                    void learnMoreDialog.show({
                      title: "Camera Permission",
                      subtitle:
                        "Oppfy is a photo-sharing app, and we require camera permissions so users can take photos directly within the app. This allows you to capture and share moments instantly with your friends. Without camera access, you won't be able to use key features of the app.",
                      acceptText: "Got it",
                    });
                  }}
                >
                  <XStack alignItems="center" gap="$2">
                    <Info size="$1" />
                    <Text color="$blue9" fontWeight="bold">
                      Learn more
                    </Text>
                  </XStack>
                </TouchableOpacity>
              }
            />
          </Group.Item>

          <Separator />

          <Group.Item>
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
              underText={
                <TouchableOpacity
                  onPress={() => {
                    void learnMoreDialog.show({
                      title: "Contacts Permission",
                      subtitle:
                        "We use your contacts so you can easily find and share posts with friends. Oppfy is a social app which doesn't work without your contacts. We encrypt your contacts for maximum security.",
                      acceptText: "Got it",
                    });
                  }}
                >
                  <XStack alignItems="center" gap="$2">
                    <Info size="$1" />
                    <Text color="$blue9" fontWeight="bold">
                      Learn more
                    </Text>
                  </XStack>
                </TouchableOpacity>
              }
            />
          </Group.Item>

          <Separator />

          <Group.Item>
            <ListItem
              emoji="🔔"
              title="Notifications"
              subTitle="So you don't miss out on what's happening"
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
              underText={
                <XStack alignItems="center" gap="$2">
                  <Info size="$1" />
                  <Text color="$gray9" fontWeight="bold">
                    Optional
                  </Text>
                </XStack>
              }
            />
          </Group.Item>
        </Group>
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onPress}
        disabled={!requiredPermissions}
      >
        Continue
      </OnboardingButton>
    </ScreenView>
  );
};

interface ListItemProps {
  emoji: string;
  title: string;
  subTitle: string;
  checkbox: React.ReactNode;
  underText?: React.ReactNode;
}

const ListItem = ({
  emoji,
  title,
  subTitle,
  checkbox,
  underText,
}: ListItemProps) => {
  return (
    <XStack alignItems="center" gap="$4">
      <Text fontSize={42}>{emoji}</Text>
      <YStack flex={1} gap>
        <H4>{title}</H4>
        <Paragraph color="$gray11">{subTitle}</Paragraph>
        {underText && <YStack marginTop="$2">{underText}</YStack>}
      </YStack>
      {checkbox}
    </XStack>
  );
};

export default Permissions;
