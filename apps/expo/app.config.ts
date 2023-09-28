import type { ExpoConfig } from "@expo/config";

const defineConfig = (): ExpoConfig => ({
  name: "expo",
  slug: "expo",
  scheme: "expo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#1F104A",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    googleServicesFile: "./GoogleService-Info.plist",
    supportsTablet: true,
    bundleIdentifier: "your.bundle.identifier",
  },
  android: {
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#1F104A",
    },
  },
  extra: {
    eas: {
      // projectId: "your-project-id",
    },
  },
  plugins: [
    "./expo-plugins/with-modify-gradle.js",
    "@react-native-firebase/app",
    "@react-native-firebase/perf",
    "@react-native-firebase/crashlytics",
  ],
});

export default defineConfig;
