import { useMemo } from "react";
import { Linking } from "react-native";
import { Stack, usePathname, useRouter } from "expo-router";
import { X } from "@tamagui/lucide-icons";

import { OnboardingHeader } from "~/components/Layouts";
import { Button, Icon, useAlertDialogController, View } from "~/components/ui";
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

  const stepTitle = useMemo(() => {
    switch (currentRoute) {
      case "name":
        return "Your Name";
      case "username":
        return "Choose Username";
      case "date-of-birth":
        return "Date of Birth";
      case "profile-picture":
        return "Profile Picture";
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

  const handleInfo = () => {
    void Linking.openURL("https://www.oppfy.app");
  };

  return (
    <View flex={1} backgroundColor="$background">
      <OnboardingHeader
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
        onInfoPress={handleInfo}
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
      />
    </View>
  );
}
