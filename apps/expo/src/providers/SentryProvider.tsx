import type { ReactNode } from "react";
import React, { useEffect } from "react";
import { useNavigationContainerRef } from "expo-router";
import * as Sentry from "@sentry/react-native";

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

Sentry.init({
  debug: false,
  enabled: !__DEV__,
  dsn: "https://55ede8542c3606c6e90656eec2d9c6c8@o4507697000611840.ingest.us.sentry.io/4507697356603392",
  integrations: [navigationIntegration],
});

interface SentryProviderProps {
  children: ReactNode;
}

const SentryProvider = ({ children }: SentryProviderProps) => {
  const ref = useNavigationContainerRef();

  useEffect(() => navigationIntegration.registerNavigationContainer(ref), [ref]);

  const SentryWrappedComponent = Sentry.wrap(() => <>{children}</>);
  return <SentryWrappedComponent />;
};

export default SentryProvider;