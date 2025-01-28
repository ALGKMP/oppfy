import { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, usePathname } from "expo-router";

import { H4, View } from "~/components/ui";

const ROUTES = [
  "/user-info/name",
  "/user-info/username",
  "/user-info/date-of-birth",
  "/user-info/profile-picture",
];

export default function UserInfoLayout() {
  const pathname = usePathname();
  const currentIndex = ROUTES.indexOf(pathname);

  const progress = useDerivedValue(() => {
    return withSpring((currentIndex + 1) / ROUTES.length, {
      mass: 0.5,
      damping: 11,
      stiffness: 100,
    });
  }, [currentIndex]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const stepText = useMemo(() => {
    switch (pathname) {
      case "/user-info/name":
        return "Your Name";
      case "/user-info/username":
        return "Choose Username";
      case "/user-info/date-of-birth":
        return "Date of Birth";
      case "/user-info/profile-picture":
        return "Profile Picture";
      default:
        return "";
    }
  }, [pathname]);

  return (
    <View flex={1} backgroundColor="$background">
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        backgroundColor="$background"
      >
        <View
          height={4}
          backgroundColor="$gray8"
          mx="$4"
          my="$4"
          borderRadius={2}
          overflow="hidden"
        >
          <Animated.View style={[styles.progressBar, progressBarStyle]}>
            <LinearGradient
              colors={["#FF6B6B", "#4ECDC4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <H4 color="$gray11" mx="$4" mb="$2">
          {stepText}
        </H4>
      </View>

      <View flex={1} mt="$12">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 200,
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    height: "100%",
  },
});
