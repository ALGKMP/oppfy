import React, { useState } from "react";
import { Linking } from "react-native";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Check } from "@tamagui/lucide-icons";
import { Checkbox, Separator, Text, XStack, YGroup, YStack } from "tamagui";

import { AlertDialog } from "~/components/Dialogs";
import { AlertDialogProps } from "~/components/Dialogs/AlertDialog";
import { BaseScreenView } from "~/components/Views";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { OnboardingButton } from "~/features/onboarding/components";

type PermissionType = "Camera" | "Contacts" | "Notifications";

interface AlertDialogState
  extends Pick<AlertDialogProps, "title" | "subtitle"> {
  isVisible: boolean;
}

const Permissions = () => {
  const router = useRouter();
  const { isSignedIn } = useSession();
  const { permissions, checkPermissions } = usePermissions();
  const [alertDialogProps, setAlertDialogProps] = useState<AlertDialogState>({
    isVisible: false,
    title: "",
    subtitle: "",
  });

  const requiredPermissions = permissions.camera && permissions.contacts;

  const openSettings = async (): Promise<void> => {
    await Linking.openSettings();
  };

  const onPress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isSignedIn
      ? router.push("/(app)/(bottom-tabs)/(home)")
      : router.push("/auth/phone-number");
  };

  const showPermissionAlert = (permissionType: PermissionType): void => {
    setAlertDialogProps({
      isVisible: true,
      title: `${permissionType} Permission`,
      subtitle: `${permissionType} permission is required for this app. Please enable it in your device settings.`,
    });
  };

  const requestPermission = async (
    permissionType: PermissionType,
    requestFunction: () => Promise<{ status: PermissionStatus }>,
  ): Promise<void> => {
    try {
      const { status } = await requestFunction();
      if (status !== PermissionStatus.GRANTED) {
        showPermissionAlert(permissionType);
      }
    } catch (error) {
      showPermissionAlert(permissionType);
    }
    await checkPermissions();
  };

  const requestCameraPermission = (): Promise<void> =>
    requestPermission("Camera", ImagePicker.requestCameraPermissionsAsync);

  const requestContactsPermission = (): Promise<void> =>
    requestPermission("Contacts", Contacts.requestPermissionsAsync);

  const requestNotificationsPermission = (): Promise<void> =>
    requestPermission("Notifications", Notifications.requestPermissionsAsync);

  return (
    <BaseScreenView paddingHorizontal={0} safeAreaEdges={["bottom"]}>
      <YStack flex={1} paddingHorizontal="$4" gap="$6">
        <Text
          alignSelf="center"
          textAlign="center"
          color="$gray9"
          fontWeight="bold"
        >
          We'll just need a few permissions to get started.
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

      <OnboardingButton onPress={onPress} disabled={!requiredPermissions}>
        Continue
      </OnboardingButton>

      <AlertDialog
        isVisible={alertDialogProps.isVisible}
        title={alertDialogProps.title}
        subtitle={alertDialogProps.subtitle}
        onCancel={() => {
          setAlertDialogProps({ ...alertDialogProps, isVisible: false });
          openSettings();
        }}
        onAccept={() =>
          setAlertDialogProps({ ...alertDialogProps, isVisible: false })
        }
        cancelText="Settings"
        acceptText="OK"
        cancelTextProps={{
          color: "$blue9",
        }}
        acceptTextProps={{
          color: "$blue9",
        }}
      />
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
