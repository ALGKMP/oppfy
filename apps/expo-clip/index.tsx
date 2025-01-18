import { Text, View } from "react-native";
import { registerRootComponent } from "expo";
import { ExpoRoot, SplashScreen } from "expo-router";

// import "expo-router/entry";

void SplashScreen.preventAutoHideAsync();
export const App = () => {
  console.log("Root AppClip");
  try {
    const ctx = require.context("./src/app");
    console.log("ctx", ctx);
    return <ExpoRoot context={ctx} />;
  } catch (error) {
    console.error("App Error:", error);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Failed to start app: {error.message}</Text>
      </View>
    );
  }
};

registerRootComponent(App);
