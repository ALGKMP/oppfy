import { useMemo } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { X } from "@tamagui/lucide-icons";

import { Button, Icon, useAlertDialogController, View } from "~/components/ui";
import { OnboardingHeader } from "~/components/ui/OnboardingHeader";
import { useAuth } from "~/hooks/useAuth";

const ROUTES = ["intro", "select-contact", "create-post"];

export default function TutorialLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const alertDialog = useAlertDialogController();

  // Get the last segment of the path
  const currentRoute = pathname.split("/").pop();
  const currentIndex = ROUTES.indexOf(currentRoute ?? "");

  const stepTitle = useMemo(() => {
    switch (currentRoute) {
      case "intro":
        return "How It Works";
      case "select-contact":
        return "Choose Friends";
      case "create-post":
        return "Create Your First Post";
      default:
        return "";
    }
  }, [currentRoute]);

  const handleClose = async () => {
    const confirmed = await alertDialog.show({
      title: "Exit Onboarding",
      subtitle:
        "Are you sure you want to quit? You'll lose any changes you've made.",
      acceptText: "Exit",
      cancelText: "Cancel",
    });

    if (confirmed) {
      await signOut();
    }
  };

  return (
    <View flex={1} backgroundColor="$background">
      <OnboardingHeader
        title={stepTitle}
        showBack={false}
        customLeftButton={
          <Button
            chromeless
            icon={<X size={24} />}
            onPress={handleClose}
            scaleIcon={1}
            marginLeft="$-2"
            opacity={0.7}
          />
        }
        progress={{
          currentStep: Math.max(0, currentIndex),
          totalSteps: ROUTES.length,
          showStepCount: true,
        }}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        {/* Media picker modal */}
        <Stack.Screen
          name="(media-picker)"
          options={{
            presentation: "modal",
          }}
        />
      </Stack>
    </View>
  );
}
