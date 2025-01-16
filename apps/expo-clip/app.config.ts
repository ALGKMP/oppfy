import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Oppfy Clip",
  slug: "oppfy-clip",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.oppfy.app.Clip",
    associatedDomains: ["appclips:yourdomain.com"],
  },
  android: {
    package: "com.oppfy.app.Clip",
  },
  plugins: ["expo-router", ["react-native-app-clip", { name: "Oppfy Clip" }]],
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "your-project-id",
    },
  },
});
