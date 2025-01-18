import { displayOverlay } from "react-native-app-clip";
import { View } from "tamagui";

import { Button, H1, Text } from "tamagui";

export default function AppClipScreen() {
  console.log("App");
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
      <H1>Welcome to Oppfy</H1>
      <Text>Quick access version</Text>
      <Button
        onPress={() => {
          // Show native iOS banner to download full app
          displayOverlay();
          console.log("displayOverlay");
        }}
      >
        Get Full App
      </Button>
    </View>
  );
}
