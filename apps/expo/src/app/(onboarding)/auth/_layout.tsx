import { Stack } from "expo-router";

import { View } from "~/components/ui";
import { OnboardingHeader } from "~/components/ui/OnboardingHeader";

export default function AuthLayout() {
  return (
    <View flex={1} backgroundColor="$background">
      <OnboardingHeader title="Sign In" showBack={false} />

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
