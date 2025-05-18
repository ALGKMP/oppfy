import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";

const AuthLayout = () => (
  <OnboardingStack
    screenOptions={{
      title: "",
      headerShown: false,
    }}
  >
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

export default AuthLayout;
