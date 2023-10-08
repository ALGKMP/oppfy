import type { ExpoConfig } from "@expo/config";

const defineConfig = (): ExpoConfig => ({
  name: "oppfy",
  slug: "oppfy",
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
    bundleIdentifier: "com.algkmp.oppfy",
  },
  android: {
    googleServicesFile: "./google-services.json",
    package: "com.algkmp.oppfy",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#1F104A",
    },
  },
  extra: {
    eas: {
      projectId: "68175593-c314-48a6-8892-7afeeb66ab9f",
    },
  },
  
  plugins: [
    "./expo-plugins/with-modify-gradle.js",
    "react-native-email-link",
    "@react-native-firebase/app",
    "@react-native-firebase/perf",
    "@react-native-firebase/crashlytics",
    [
      'expo-build-properties',
      {
        "ios": {
          "useFrameworks": "static"
        }
      },
    ],
  ],
});

export default defineConfig;
