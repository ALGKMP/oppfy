import { registerRootComponent } from "expo";
import { ExpoRoot, SplashScreen } from "expo-router";
import * as Sentry from "@sentry/react-native";

import { env } from "@oppfy/env";

void SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: env.SENTRY_DSN,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

// Must be exported or Fast Refresh won't update the context
const App = () => {
  const ctx = require.context("./src/app");
  return <ExpoRoot context={ctx} />;
};

export default Sentry.wrap(App); // export default might break shit

registerRootComponent(App);
