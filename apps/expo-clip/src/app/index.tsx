import { Button, Linking, StyleSheet, Text, View } from "react-native";
import * as ReactNativeAppClip from "react-native-app-clip";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

export default function AppClipScreen() {
  const params = useLocalSearchParams<{
    id: string;
    media: string;
    name: string;
  }>();

  const handleDownloadApp = () => {
    if (ReactNativeAppClip.isClip()) {
      console.log("Clip worked")
      ReactNativeAppClip.displayOverlay();
    } else {
      console.log("Clip didn't work")
      void Linking.openURL("https://apps.apple.com/app/6736484676");
    }
  };
  console.log("here")

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Hey {decodeURIComponent(params.name || "")}!
        </Text>
        <Text style={styles.subtitle}>
          Someone posted this for you on Oppfy
        </Text>

        <Image
          source={{ uri: decodeURIComponent(params.media || "") }}
          style={styles.image}
          contentFit="cover"
        />

        <Button
          title="Get the full app to see who posted this now"
          onPress={handleDownloadApp}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
  },
});
