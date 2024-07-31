import { registerRootComponent } from "expo";
import { ExpoRoot, SplashScreen } from "expo-router";

void SplashScreen.preventAutoHideAsync();

// Sentry.init({
//   // dsn: env.SENTRY_DSN,
//   dsn: "https://55ede8542c3606c6e90656eec2d9c6c8@o4507697000611840.ingest.us.sentry.io/4507697356603392",
//   debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
// });

// Must be exported or Fast Refresh won't update the context
export const App = () => {
  const ctx = require.context("./src/app");
  return <ExpoRoot context={ctx} />;
};

registerRootComponent(App);
