import { Text, View } from "react-native";
import { registerRootComponent } from "expo";
import { ExpoRoot, SplashScreen } from "expo-router";

void SplashScreen.preventAutoHideAsync();
export const App = () => {
  console.log("Root AppClip");
  try {
    const ctx = require.context("./src/app");
    console.log("ctx", ctx);
    return <ExpoRoot context={ctx} />;
  } catch (error) {
    console.error("App Error:", error);
    if (error instanceof Error) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Failed to start app: {error.message}</Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Failed to start app: No Error Message</Text>
      </View>
    );
  }
};

registerRootComponent(App);
