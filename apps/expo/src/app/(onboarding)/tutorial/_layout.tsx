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
  "/tutorial/intro",
  "/tutorial/select-contact",
  "/tutorial/create-post",
];

export default function TutorialLayout() {
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
      case "/tutorial/intro":
        return "How It Works";
      case "/tutorial/select-contact":
        return "Choose Friends";
      case "/tutorial/create-post":
        return "Create Your First Post";
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
        >
          {/* Media picker modal */}
          <Stack.Screen
            name="(media-picker)"
            options={{
              presentation: "modal",
            }}
          />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    height: "100%",
  },
});
