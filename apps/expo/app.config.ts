import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "oppfy",
  slug: "oppfy",
  scheme: "oppfy",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#151515",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    googleServicesFile: "./GoogleService-Info.plist",
    supportsTablet: true,
    bundleIdentifier: "app.oppfy",
    entitlements: {
      "aps-environment": "development",
    },
    associatedDomains: [
      "applinks:oppfy.app",
      "applinks:www.oppfy.app",
      "applinks:oppfy-nextjs.vercel.app",
    ],
  },
  android: {
    googleServicesFile: "./google-services.json",
    package: "app.oppfy",
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
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  plugins: [
    "expo-font",
    "expo-video",
    "expo-router",
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    "@react-native-firebase/perf",
    "@react-native-firebase/crashlytics",
    [
      "react-native-vision-camera",
      {
        cameraPermissionText: "$(PRODUCT_NAME) needs access to your Camera.",
        microphonePermissionText:
          "$(PRODUCT_NAME) needs access to your Microphone.",
        enableMicrophonePermission: true,
        enableCodeScanner: true,
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow $(PRODUCT_NAME) to use your location.",
      },
    ],
    [
      "expo-contacts",
      {
        contactsPermission: "Allow $(PRODUCT_NAME) to access your contacts.",
      },
    ],
    [
      "expo-media-library",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "The app accesses your photos to let you share them with your friends.",
      },
    ],
    [
      "expo-av",
      {
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: "34.0.0",
        },
        ios: {
          useFrameworks: "static",
        },
      },
    ],
    [
      "expo-asset",
      {
        assets: ["./assets"],
      },
    ],
    [
        "react-native-creative-sdk",
        {
          "clientId": "e029e4cb-efc7-43c4-bab3-608dce70c69f"
        }
      ]
  ],
});
