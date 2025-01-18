import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Oppfy",
  slug: "oppfy-clip",
  scheme: "oppfy-clip",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#F214FF",
  },
  runtimeVersion: {
    policy: "nativeVersion",
  },
  assetBundlePatterns: ["**/*"],

  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.oppfy.app.Clip",
    associatedDomains: [
      "applinks:oppfy.app",
      "applinks:www.oppfy.app",
      "applinks:oppfy.app",
      "applinks:oppfy-nextjs.vercel.app",
    ],
  },
  android: {
    package: "com.oppfy.app.Clip",
  },
  newArchEnabled: false,
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "68175593-c314-48a6-8892-7afeeb66ab9f",
    },
  },
  plugins: [
    "expo-router",
    [
      "react-native-app-clip",
      {
        name: "Oppfy",
        groupIdentifier: "group.com.oppfy.app",
        deploymentTarget: "16.0",
      },
    ],
  ],
});
