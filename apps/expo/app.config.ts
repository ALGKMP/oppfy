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
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#F214FF",
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/68175593-c314-48a6-8892-7afeeb66ab9f",
  },
  runtimeVersion: {
    policy: "nativeVersion",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    googleServicesFile: "./GoogleService-Info.plist",
    supportsTablet: false,
    bundleIdentifier: "app.oppfy",
    entitlements: {
      "aps-environment": "development",
    },
    associatedDomains: [
      "applinks:oppfy.app",
      "applinks:www.oppfy.app",
      "applinks:app.oppfy.app",
      "applinks:oppfy-nextjs.vercel.app",
    ],
    infoPlist: {
      UIBackgroundModes: ["fetch"],
    },
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
    "expo-av",
    "expo-font",
    "expo-video",
    "expo-router",
    "react-native-image-marker",
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    "@react-native-firebase/perf",
    "@react-native-firebase/crashlytics",
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
      "@sentry/react-native/expo",
      {
        organization: "oppfy",
        project: "oppfy-app",
      },
    ],
    [
      "react-native-vision-camera",
      {
        enableLocation: true,
        enableCodeScanner: true,
        enableMicrophonePermission: true,
        cameraPermissionText:
          "Oppfy would like to access your camera to take photos and videos to share with friends",
        microphonePermissionText:
          "Oppfy needs microphone access to record audio for videos to share with friends",
        locationPermissionText:
          "Oppfy uses your location to tag photos with where they were taken.",
      },
    ],
    // [
    //   "expo-location",
    //   {
    //     locationWhenInUsePermission:
    //       "Oppfy uses your location to tag photos with where they were taken.",
    //   },
    // ],
    // [
    //   "./snapchat-plugin",
    //   { snapchatClientId: "e029e4cb-efc7-43c4-bab3-608dce70c69f" },
    // ],
    [
      "expo-contacts",
      {
        contactsPermission:
          "Oppfy would like to upload your contacts to our server to help you find your friends",
      },
    ],
    [
      "expo-media-library",
      {
        photosPermission:
          "Oppfy would like to access your photos so you can pick photos and videos to share with friends",
        savePhotosPermission:
          "Oppfy needs permission to save photos and videos to your device.",
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Oppfy would like to access your photos so you can pick photos and videos to share with friends",
      },
    ],
  ],
});
