import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import type { RequireContext } from "expo-router/build/types";
import * as SplashScreen from "expo-splash-screen";

void SplashScreen.preventAutoHideAsync();

// Must be exported or Fast Refresh won't update the context
export const App = () => {
  const ctx = require.context("./src/app") as RequireContext;
  return <ExpoRoot context={ctx} />;
};

registerRootComponent(App);
