import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';

void SplashScreen.preventAutoHideAsync();

// Must be exported or Fast Refresh won't update the context
export const App = () => {
  const ctx = require.context("./src/app");
  return <ExpoRoot context={ctx} />;
};

registerRootComponent(App);