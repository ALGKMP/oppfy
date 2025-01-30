import { usePathname } from "expo-router";

import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";
import type { OnboardingStackOptions } from "~/components/Layouts/Navigation/OnboardingStack";
import { Icon, useAlertDialogController } from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";

const ROUTES = ["name", "username", "date-of-birth", "profile-picture"];

export default function UserInfoLayout() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const alertDialog = useAlertDialogController();

  // Get the last segment of the path
  const currentRoute = pathname.split("/").pop();
  const currentIndex = ROUTES.indexOf(currentRoute ?? "");

  const handleClose = async () => {
    const confirmed = await alertDialog.show({
      title: "Exit Onboarding",
      subtitle:
        "Are you sure you want to quit? You'll lose any changes you've made.",
      acceptText: "Exit",
      cancelText: "Cancel",
    });

    if (confirmed) {
      signOut();
    }
  };

  return (
    <OnboardingStack
      screenOptions={
        {
          animation: "fade",
          gestureEnabled: false,
          progress: {
            currentStep: Math.max(0, currentIndex),
            totalSteps: ROUTES.length,
          },
        } as OnboardingStackOptions
      }
    >
      <OnboardingStack.Screen
        name="name"
        options={{
          headerLeft: () => (
            <Icon
              name="close"
              onPress={handleClose}
              iconStyle={{ opacity: 0.7 }}
            />
          ),
        }}
      />
      <OnboardingStack.Screen name="username" />
      <OnboardingStack.Screen name="date-of-birth" />
      <OnboardingStack.Screen name="profile-picture" />
    </OnboardingStack>
  );
}
