import { Linking } from "react-native";
import { Info } from "@tamagui/lucide-icons";

import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";
import { Button } from "~/components/ui";

export default function AuthLayout() {
  const handleInfo = () => {
    void Linking.openURL("https://www.oppfy.app");
  };

  return (
    <OnboardingStack
      screenOptions={{
        title: "Sign In",
      }}
    />
  );
}
