import { usePathname } from "expo-router";

import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";
import type { OnboardingStackOptions } from "~/components/Layouts/Navigation/OnboardingStack";

const ROUTES = ["index", "screen2"];

const AuthLayout = () => {
  const pathName = usePathname();
  const currentRoute = pathName.split("/").pop();
  const currentIndex = ROUTES.indexOf(currentRoute ?? "");

  return (
    <OnboardingStack
      screenOptions={
        {
          title: "",
          animation: "fade",
          headerShown: false,
          progress: {
            currentStep: Math.max(0, currentIndex),
            totalSteps: ROUTES.length,
          },
        } as OnboardingStackOptions
      }
    >
      <OnboardingStack.Screen
        name="index"
        options={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "$primary",
          },
        }}
      />

      <OnboardingStack.Screen
        name="screen1"
        options={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "screen1",
          },
        }}
      />

      <OnboardingStack.Screen
        name="screen2"
        options={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#C7F458",
          },
        }}
      />
    </OnboardingStack>
  );
};

export default AuthLayout;
