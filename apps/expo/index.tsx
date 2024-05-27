import { registerRootComponent } from "expo";
import { ExpoRoot, SplashScreen } from "expo-router";

void SplashScreen.preventAutoHideAsync();

// Must be exported or Fast Refresh won't update the context
export const App = () => {
  const ctx = require.context("./src/app");
  return <ExpoRoot context={ctx} />;
};

registerRootComponent(App);
