import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";

const InviteLayout = () => (
  <OnboardingStack
    screenOptions={{
      title: "",
      gestureEnabled: false,
    }}
  >
    <OnboardingStack.Screen
      name="index"
      options={{
        headerShown: false,
      }}
    />
  </OnboardingStack>
);

export default InviteLayout;
