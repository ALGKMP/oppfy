import { usePathname } from "expo-router";

import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";
import type { OnboardingStackOptions } from "~/components/Layouts/Navigation/OnboardingStack";
import { Icon, useAlertDialogController } from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";

const ROUTES = ["intro", "select-contact", "create-post"];

export default function TutorialLayout() {
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
        name="intro"
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
      <OnboardingStack.Screen name="select-contact" />
      <OnboardingStack.Screen name="create-post" />
      <OnboardingStack.Screen
        name="(media-picker)"
        options={{
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
    </OnboardingStack>
  );
}
