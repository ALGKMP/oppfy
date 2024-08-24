// SentryProvider.tsx
import React from "react";
import { isRunningInExpoGo } from "expo";
import { useNavigationContainerRef } from "expo-router";
import * as Sentry from "@sentry/react-native";

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

Sentry.init({
  debug: __DEV__,
  enabled: !__DEV__,
  dsn: "https://55ede8542c3606c6e90656eec2d9c6c8@o4507697000611840.ingest.us.sentry.io/4507697356603392",
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
      enableNativeFramesTracking: !isRunningInExpoGo(),
    }),
  ],
});

interface SentryProviderProps {
  children: React.ReactNode;
}

const SentryProvider: React.FC<SentryProviderProps> = ({ children }) => {
  const ref = useNavigationContainerRef();

  React.useEffect(
    () => routingInstrumentation.registerNavigationContainer(ref),
    [ref],
  );

  const SentryWrappedComponent = Sentry.wrap(() => <>{children}</>);
  return <SentryWrappedComponent />;
};

export default SentryProvider;
