import { displayOverlay } from "react-native-app-clip";
import { View } from "tamagui";

import { H1, Text, Button } from "~/components/ui";

export default function AppClipScreen() {
  return (
    <View flex={1} justifyContent="center" alignItems="center" padding="$4">
      <H1>Welcome to Oppfy</H1>
      <Text>Quick access version</Text>
      <Button
        onPress={() => {
          // Show native iOS banner to download full app
          displayOverlay();
        }}
      >
        Get Full App
      </Button>
    </View>
  );
}
