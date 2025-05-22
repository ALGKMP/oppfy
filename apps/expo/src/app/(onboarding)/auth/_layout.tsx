import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";
import type { OnboardingStackOptions } from "~/components/Layouts/Navigation/OnboardingStack";

const AuthLayout = () => (
  <OnboardingStack
    screenOptions={{
      title: "",
      gestureEnabled: false,
    }}
  >
    <OnboardingStack.Screen
      name="phone-number"
      options={{
        gestureEnabled: false,
        headerLeft: () => null,
        headerRight: () => null,
      }}
    />

    {/* Other screens can have back navigation */}
    <OnboardingStack.Screen name="otp" />
  </OnboardingStack>
);

export default AuthLayout;
