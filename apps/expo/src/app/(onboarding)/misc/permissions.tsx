import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  // No container-scale animations
  // SlideInRight, useAnimatedStyle, useSharedValue, withSpring,
} from "react-native-reanimated";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Theme } from "tamagui";

import {
  Button,
  Checkbox,
  Group,
  Icon,
  Paragraph,
  Separator,
  Text,
  useAlertDialogController,
  useDialogController,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { OnboardingButton, OnboardingScreen } from "~/components/ui/Onboarding";
import { usePermissions } from "~/contexts/PermissionsContext";
import { useContacts } from "~/hooks/contacts";
import { useAuth } from "~/hooks/useAuth";

type PermissionType = "Camera" | "Contacts" | "Notifications";

interface Permission {
  type: PermissionType;
  emoji: string;
  title: string;
  subtitle: string;
  isRequired: boolean;
  description: string;
}

const PERMISSIONS: Permission[] = [
  {
    type: "Camera",
    emoji: "📸",
    title: "Camera",
    subtitle: "Take photos of your friends",
    isRequired: true,
    description:
      "Oppfy is a photo-sharing app, and we require camera permissions so users can take photos directly within the app. This allows you to capture and share moments instantly with your friends. Without camera access, you won't be able to use key features of the app.",
  },
  {
    type: "Contacts",
    emoji: "📱",
    title: "Contacts",
    subtitle: "Find and connect with friends",
    isRequired: true,
    description:
      "We use your contacts so you can easily find and share posts with friends. Oppfy is a social app which doesn't work without your contacts. We encrypt your contacts for maximum security.",
  },
  {
    type: "Notifications",
    emoji: "🔔",
    title: "Push Notifications",
    subtitle: "Stay updated on what's happening",
    isRequired: false,
    description:
      "Enable notifications to stay updated when friends post about you or interact with your content. You can always change this later in settings.",
  },
];

/**
 * A stable item that doesn't change layout between granted vs. not granted.
 * - Always has borderWidth={2}, never 'transparent'
 * - No scale on press, to avoid reflow.
 * - If you truly want an animation on press, consider an opacity or highlight that doesn't affect container layout.
 */
function PermissionItem({
  permission,
  onRequestPermission,
  isGranted,
  onLearnMore,
}: {
  permission: Permission;
  onRequestPermission: () => void;
  isGranted: boolean;
  onLearnMore: () => void;
}) {
  return (
    <TouchableOpacity onPress={!isGranted ? onRequestPermission : undefined}>
      <YStack
        padding="$3"
        borderRadius="$6"
        borderWidth={2}
        borderColor={
          isGranted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"
        }
        backgroundColor="rgba(255,255,255,0.1)"
        shadowColor="#fff"
        shadowOpacity={0.1}
        shadowRadius={20}
        shadowOffset={{ width: 0, height: 10 }}
      >
        {/* Title + info icon */}
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$6" fontWeight="600" color="white">
            {permission.emoji} {permission.title}
          </Text>

          <TouchableOpacity
            onPress={onLearnMore}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <XStack
              padding="$2"
              borderRadius="$4"
              alignItems="center"
              alignSelf="flex-start"
              backgroundColor="rgba(255,255,255,0.1)"
              gap="$2"
            >
              <Icon name="information-circle" disabled />
            </XStack>
          </TouchableOpacity>
        </XStack>

        <YStack gap="$3">
          <Paragraph color="rgba(255,255,255,0.5)" size="$4">
            {permission.subtitle}
          </Paragraph>

          <YStack
            backgroundColor={
              isGranted ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)"
            }
            opacity={isGranted ? 0.9 : 1}
            padding="$3"
            borderRadius="$6"
            justifyContent="center"
            alignItems="center"
            flexDirection="row"
            gap="$2"
          >
            <Text fontSize="$3" fontWeight="600">
              {isGranted ? "Enabled" : "Enable Access"}
            </Text>
            {isGranted && <Icon name="checkmark" size={18} disabled />}
          </YStack>
        </YStack>
      </YStack>
    </TouchableOpacity>
  );
}

// The main Permissions screen, rewritten to keep layout stable:
export default function Permissions() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { permissions, checkPermissions } = usePermissions();
  const { syncContacts } = useContacts();

  const alertDialog = useAlertDialogController();
  const learnMoreDialog = useDialogController();

  // required means both camera + contacts must be granted
  const requiredPermissions = permissions.camera && permissions.contacts;

  const openSettings = async (): Promise<void> => {
    await Linking.openSettings();
  };

  const onContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (requiredPermissions) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(
        isSignedIn ? "/(app)/(bottom-tabs)/(home)" : "/auth/phone-number",
      );
    }
  };

  const showPermissionAlert = async (permissionType: PermissionType) => {
    const confirmed = await alertDialog.show({
      title: `Enable ${permissionType}`,
      subtitle: `Please enable ${permissionType.toLowerCase()} access in your device settings to continue using Oppfy.`,
      cancelText: "Not Now",
      acceptText: "Open Settings",
      acceptTextProps: {
        color: "$blue9",
      },
      cancelTextProps: {
        color: "$gray9",
      },
    });
    if (confirmed) {
      void openSettings();
    }
  };

  // A single function to handle each permission
  async function handlePermissionRequest(
    permissionType: PermissionType,
    requestFunction: () => Promise<{
      status: PermissionStatus;
      canAskAgain: boolean;
    }>,
    getStatusFunction: () => Promise<{
      status: PermissionStatus;
      canAskAgain: boolean;
    }>,
  ) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status, canAskAgain } = await getStatusFunction();
    if (status !== PermissionStatus.GRANTED && canAskAgain) {
      try {
        const result = await requestFunction();
        if (result.status === PermissionStatus.GRANTED) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } else {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
        }
        await checkPermissions();
      } catch {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        void showPermissionAlert(permissionType);
      }
    } else if (status !== PermissionStatus.GRANTED) {
      void showPermissionAlert(permissionType);
    }
  }

  async function requestPermission(type: PermissionType) {
    switch (type) {
      case "Camera":
        return handlePermissionRequest(
          type,
          ImagePicker.requestCameraPermissionsAsync,
          ImagePicker.getCameraPermissionsAsync,
        );
      case "Contacts": {
        const result = await handlePermissionRequest(
          type,
          Contacts.requestPermissionsAsync,
          Contacts.getPermissionsAsync,
        );
        const current = await Contacts.getPermissionsAsync();
        if (current.status === PermissionStatus.GRANTED) {
          void syncContacts();
        }
        return result;
      }
      case "Notifications":
        return handlePermissionRequest(
          type,
          Notifications.requestPermissionsAsync,
          Notifications.getPermissionsAsync,
        );
    }
  }

  function getPermissionStatus(type: PermissionType) {
    switch (type) {
      case "Camera":
        return permissions.camera;
      case "Contacts":
        return permissions.contacts;
      case "Notifications":
        return permissions.notifications;
    }
  }

  return (
    <OnboardingScreen
      title="Just a few things..."
      subtitle="We need some permissions to give you the best experience"
      footer={
        <OnboardingButton
          onPress={onContinue}
          disabled={!requiredPermissions}
          text={
            requiredPermissions ? "Continue" : "Enable Required Permissions"
          }
          isValid={requiredPermissions}
        />
      }
    >
      <Animated.View entering={FadeInDown.springify()}>
        <YStack gap="$4">
          {PERMISSIONS.map((perm) => (
            <PermissionItem
              key={perm.type}
              permission={perm}
              isGranted={getPermissionStatus(perm.type)}
              onLearnMore={() => {
                void learnMoreDialog.show({
                  title: perm.title,
                  subtitle: perm.description,
                  acceptText: "Got it",
                });
              }}
              onRequestPermission={() => {
                void requestPermission(perm.type);
              }}
            />
          ))}
        </YStack>
      </Animated.View>
    </OnboardingScreen>
  );
}
