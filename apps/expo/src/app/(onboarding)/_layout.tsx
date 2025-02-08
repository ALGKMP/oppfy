import React from "react";

import { OnboardingStack } from "~/components/Layouts/Navigation/OnboardingStack";

const OnboardingLayout = () => (
  <OnboardingStack
    screenOptions={{
      gestureEnabled: false,
    }}
  >
    <OnboardingStack.Screen
      name="index"
      options={{
        headerShown: false,
      }}
    />

    {/* Main route groups */}
    <OnboardingStack.Screen
      name="auth"
      options={{
        headerShown: false,
      }}
    />

    <OnboardingStack.Screen
      name="user-info"
      options={{
        headerShown: false,
      }}
    />

    <OnboardingStack.Screen
      name="tutorial"
      options={{
        headerShown: false,
      }}
    />

    {/* Misc screens like permissions that can be accessed from anywhere */}
    <OnboardingStack.Screen
      name="misc/permissions"
      options={{
        title: "",
      }}
    />
  </OnboardingStack>
);

export default OnboardingLayout;
