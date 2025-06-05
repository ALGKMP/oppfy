import { Linking, TouchableOpacity } from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

import {
  Group,
  Icon,
  Paragraph,
  Text,
  useAlertDialogController,
  useDialogController,
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
      "We use your contacts to help you find and connect with friends on Oppfy. Your contact information will be uploaded to our servers to enable these features. By granting this permission, you consent to this data upload. We encrypt your contacts for maximum security and handle them according to our Privacy Policy.",
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

const AnimatedPermissionItem = ({
  permission,
  onRequestPermission,
  isGranted,
  index,
  onLearnMore,
}: {
  permission: Permission;
  onRequestPermission: () => void;
  isGranted: boolean;
  index: number;
  onLearnMore: () => void;
}) => {
  const scale = useSharedValue(1);

  const handlePress = async () => {
    if (!isGranted) {
      scale.value = withSpring(0.95, { mass: 0.5, damping: 4 });
      await new Promise((resolve) => setTimeout(resolve, 100));
      scale.value = withSpring(1, { mass: 0.5, damping: 4 });
      onRequestPermission();
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 200).springify()}
      exiting={FadeOut}
      style={containerStyle}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={isGranted}
        style={{ width: "100%" }}
      >
        <YStack
          backgroundColor="rgba(255,255,255,0.1)"
          borderRadius="$6"
          padding="$3"
          borderWidth={2}
          borderColor={isGranted ? "rgba(255,255,255,0.2)" : "transparent"}
          shadowColor="#fff"
          shadowOpacity={0.1}
          shadowRadius={20}
          shadowOffset={{ width: 0, height: 10 }}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$6" fontWeight="600" color="white">
              {permission.emoji} {permission.title}
            </Text>

            <Icon name="information-circle" onPress={onLearnMore} />
          </XStack>

          <YStack gap="$2">
            <Paragraph color="rgba(255,255,255,0.5)" size="$4">
              {permission.subtitle}
            </Paragraph>

            <YStack
              backgroundColor={
                isGranted ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"
              }
              opacity={isGranted ? 0.8 : 1}
              padding="$3"
              borderRadius="$6"
              justifyContent="center"
              alignItems="center"
              flexDirection="row"
              gap="$2"
            >
              <Text color="white" fontSize="$3" fontWeight="600">
                {isGranted ? "Enabled" : "Enable Access"}
              </Text>
              {isGranted ? (
                <Icon name="checkmark" size={18} color="white" />
              ) : null}
            </YStack>
          </YStack>
        </YStack>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Permissions = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { permissions, checkPermissions } = usePermissions();

  const alertDialog = useAlertDialogController();
  const learnMoreDialog = useDialogController();

  const allPermissions =
    permissions.camera && permissions.contacts && permissions.notifications;
  const requiredPermissions = permissions.camera && permissions.contacts;

  const openSettings = async (): Promise<void> => {
    await Linking.openSettings();
  };

  const onContinue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    router.push(
      isSignedIn ? "/(app)/(bottom-tabs)/(home)" : "/auth/phone-number",
    );
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { canAskAgain, status } = await getStatusFunction();

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
  };

  const requestPermission = async (type: PermissionType) => {
    switch (type) {
      case "Camera":
        return handlePermissionRequest(
          type,
          ImagePicker.requestCameraPermissionsAsync,
          ImagePicker.getCameraPermissionsAsync,
        );
      case "Contacts": {
        return await handlePermissionRequest(
          type,
          Contacts.requestPermissionsAsync,
          Contacts.getPermissionsAsync,
        );
      }
      case "Notifications":
        return handlePermissionRequest(
          type,
          Notifications.requestPermissionsAsync,
          Notifications.getPermissionsAsync,
        );
    }
  };

  const getPermissionStatus = (type: PermissionType) => {
    switch (type) {
      case "Camera":
        return permissions.camera;
      case "Contacts":
        return permissions.contacts;
      case "Notifications":
        return permissions.notifications;
    }
  };

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
          isValid={allPermissions}
        />
      }
      successMessage={
        allPermissions ? "All permissions are enabled! 🎉" : undefined
      }
    >
      <Group orientation="vertical" gap="$3">
        {PERMISSIONS.map((permission, index) => (
          <Group.Item key={permission.type}>
            <AnimatedPermissionItem
              permission={permission}
              onRequestPermission={() =>
                void requestPermission(permission.type)
              }
              isGranted={getPermissionStatus(permission.type)}
              index={index}
              onLearnMore={() => {
                void learnMoreDialog.show({
                  title: permission.title,
                  subtitle: permission.description,
                  acceptText: "Got it",
                });
              }}
            />
          </Group.Item>
        ))}
      </Group>
    </OnboardingScreen>
  );
};

export default Permissions;
