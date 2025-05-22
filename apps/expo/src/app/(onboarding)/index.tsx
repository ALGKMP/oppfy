import { useEffect } from "react";
import { Image } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Logo from "@assets/icons/splash-icon.png";

import { ScreenView } from "~/components/ui";

export default function Start() {
  const router = useRouter();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Animation sequence
    scale.value = withSequence(
      // Scale up slightly
      withTiming(1.2, { duration: 600, easing: Easing.out(Easing.ease) }),
      // Back to normal size
      withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      // Delay before final animation
      withDelay(
        200,
        // Scale up while fading out
        withTiming(1.5, { duration: 800, easing: Easing.out(Easing.ease) }),
      ),
    );

    // Fade out during final scale animation
    opacity.value = withDelay(
      1200, // Delay until the final scale animation
      withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }),
    );

    // Navigate after animation completes
    setTimeout(() => {
      router.push("/tutorial");
    }, 2200);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <ScreenView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Animated.View style={animatedStyle}>
        <Image
          source={Logo}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </Animated.View>
    </ScreenView>
  );
}
