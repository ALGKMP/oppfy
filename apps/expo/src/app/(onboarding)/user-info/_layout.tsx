import { useMemo } from "react";
import { Linking } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Info, X } from "@tamagui/lucide-icons";

import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";
import type { OnboardingStackOptions } from "~/components/Layouts/Navigation/OnboardingStack";
import { Button, useAlertDialogController } from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";

const ROUTES = ["name", "username", "date-of-birth", "profile-picture"];

export default function UserInfoLayout() {
  const pathname = usePathname();
  const router = useRouter();
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

  const handleInfo = () => {
    void Linking.openURL("https://www.oppfy.app");
  };

  return (
    <OnboardingStack
      screenOptions={
        {
          headerLeft: () => (
            <Button
              chromeless
              icon={<X size={20} color="$color" />}
              onPress={handleClose}
              scaleIcon={1}
            />
          ),
          headerRight: () => (
            <Button
              chromeless
              icon={<Info size={20} color="$color" />}
              onPress={handleInfo}
              scaleIcon={1}
            />
          ),
          progress: {
            currentStep: Math.max(0, currentIndex),
            totalSteps: ROUTES.length,
          },
        } as OnboardingStackOptions
      }
    />
  );
}
