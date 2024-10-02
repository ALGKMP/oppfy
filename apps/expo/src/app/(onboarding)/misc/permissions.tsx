import React, { useState } from "react";
import { Linking, TouchableOpacity } from "react-native";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import type { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Check, Info } from "@tamagui/lucide-icons";
import {
  Checkbox,
  Separator,
  Text,
  View,
  XStack,
  YGroup,
  YStack,
} from "tamagui";

import { AlertDialog, Dialog } from "~/components/Dialogs";
import type { AlertDialogProps } from "~/components/Dialogs/AlertDialog";
import { BaseScreenView } from "~/components/Views";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useSession } from "~/contexts/SessionContext";
import { OnboardingButton } from "~/features/onboarding/components";

type PermissionType = "Camera" | "Contacts" | "Notifications";

interface AlertDialogState
  extends Pick<AlertDialogProps, "title" | "subtitle"> {
  isVisible: boolean;
}

interface LearnMoreDialogState {
  title: string;
  subtitle: string;
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
  const [learnMoreDialogProps, setLearnMoreDialogProps] =
    useState<LearnMoreDialogState>({
      title: "",
      subtitle: "",
      isVisible: false,
    });

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

  const showPermissionAlert = (permissionType: PermissionType): void => {
    setAlertDialogProps({
      isVisible: true,
      title: `${permissionType} Permission`,
      subtitle: `Oppfy uses ${permissionType} to offer users the best experience. You can enable or disable this permission at any time in the settings.`,
    });
  };

  const handlePermissionRequest = async (
    permissionType: PermissionType,
    requestFunction: () => Promise<{ status: PermissionStatus }>,
  ): Promise<void> => {
    const permissionKey =
      permissionType.toLowerCase() as keyof typeof permissions;

    if (!permissions[permissionKey]) {
      try {
        await requestFunction();
        await checkPermissions();
      } catch (error) {
        showPermissionAlert(permissionType);
        console.error(error);
      }
    } else {
      // If permission is already set (either granted or denied), show the alert
      showPermissionAlert(permissionType);
    }
  };

  const requestCameraPermission = (): Promise<void> =>
    handlePermissionRequest(
      "Camera",
      ImagePicker.requestCameraPermissionsAsync,
    );

  const requestContactsPermission = (): Promise<void> =>
    handlePermissionRequest("Contacts", Contacts.requestPermissionsAsync);

  const requestNotificationsPermission = (): Promise<void> =>
    handlePermissionRequest(
      "Notifications",
      Notifications.requestPermissionsAsync,
    );

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
              underText={
                <View marginTop="$2">
                  <TouchableOpacity
                    onPress={() =>
                      setLearnMoreDialogProps({
                        title: "Contacts Permission",
                        subtitle:
                          "We use your contacts so you can easily find and share posts with friends. Oppfy is a social app which doesn't work without your contacts. We encrypt your contacts for maximum security.",
                        isVisible: true,
                      })
                    }
                  >
                    <XStack alignItems="center" gap="$2">
                      <Info size="$1" />
                      <Text color="$blue9" fontWeight="bold">
                        Learn more
                      </Text>
                    </XStack>
                  </TouchableOpacity>
                </View>
              }
            />
          </YGroup.Item>
          <Separator />

          <YGroup.Item>
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
                <View marginTop="$2">
                  <XStack alignItems="center" gap="$2">
                    <Info size="$1" />
                    <Text color="$gray9" fontWeight="bold">
                      Optional
                    </Text>
                  </XStack>
                </View>
              }
            />
          </YGroup.Item>
        </YGroup>
      </YStack>

      <OnboardingButton onPress={onPress} disabled={!requiredPermissions}>
        Continue
      </OnboardingButton>

      <Dialog
        title="Your privacy matters to us"
        subtitle="We use your contacts so you can easily find and share posts with friends. Oppfy is a social app which doesn't work without your contacts. We encrypt your contacts for maximum security."
        isVisible={learnMoreDialogProps.isVisible}
        onAccept={() => setLearnMoreDialogVisible(false)}
        acceptText="Got it"
        acceptTextProps={{
          color: "$blue9",
        }}
      />

      <AlertDialog
        isVisible={alertDialogProps.isVisible}
        title={alertDialogProps.title}
        subtitle={alertDialogProps.subtitle}
        onCancel={() => {
          setAlertDialogProps({ ...alertDialogProps, isVisible: false });
          void openSettings();
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
      <Text fontSize="$10">{emoji}</Text>

      <YStack flex={1} gap>
        <Text fontSize="$7" fontWeight="bold">
          {title}
        </Text>
        <Text color="$gray9">{subTitle}</Text>
        {underText}
      </YStack>

      {checkbox}
    </XStack>
  );
};

export default Permissions;
