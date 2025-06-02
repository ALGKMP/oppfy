import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Oppfy",
  slug: "oppfy",
  scheme: "oppfy",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icons/icon.png",
  userInterfaceStyle: "dark",
  updates: {
    enabled: true,
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/68175593-c314-48a6-8892-7afeeb66ab9f",
  },
  runtimeVersion: "1.0.0",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.oppfy.app",
    entitlements: {
      "aps-environment": "development",
    },
    associatedDomains: ["applinks:oppfy.app", "applinks:www.oppfy.app"],
    infoPlist: {
      UIBackgroundModes: ["fetch"],
      ITSAppUsesNonExemptEncryption: false,
    },
    icon: {
      dark: "./assets/icons/icon.png",
      light: "./assets/icons/icon.png",
      tinted: "./assets/icons/icon.png",
    },
  },
  android: {
    package: "com.oppfy.app",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/icons/adaptive-icon.png",
      monochromeImage: "./assets/icons/adaptive-icon.png",
      backgroundColor: "#F214FF",
    },
  },
  extra: {
    eas: {
      projectId: "68175593-c314-48a6-8892-7afeeb66ab9f",
    },
  },
  newArchEnabled: false,
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
    reactCompiler: true,
  },
  plugins: [
    "expo-av",
    "expo-font",
    "expo-router",
    "react-native-image-marker",
    [
      "expo-splash-screen",
      {
        image: "./assets/icons/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#F214FF",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: false,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: "35.0.0",
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
