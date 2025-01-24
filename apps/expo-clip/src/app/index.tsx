import { useEffect } from "react";
import { Linking } from "react-native";
import * as ReactNativeAppClip from "react-native-app-clip";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Button, styled, Text, View, YStack } from "tamagui";

const HeaderText = styled(Text, {
  fontFamily: "$heading",
  fontSize: "$12",
  color: "#fff",
});

const AnimatedText = Animated.createAnimatedComponent(HeaderText);

export default function AppClipScreen() {
  const params = useLocalSearchParams<{
    id: string;
    media: string;
    name: string;
  }>();

  const translateX1 = useSharedValue(100);
  const translateX2 = useSharedValue(100);
  const translateX3 = useSharedValue(100);
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const opacity3 = useSharedValue(0);

  useEffect(() => {
    const config = {
      duration: 700,
      easing: Easing.bezier(0.16, 1, 0.3, 1), // Fast-out, slow-in curve
    };

    const INITIAL_DELAY = 500; // Half second initial delay

    translateX1.value = withDelay(INITIAL_DELAY, withTiming(0, config));
    translateX2.value = withDelay(INITIAL_DELAY + 100, withTiming(0, config));
    translateX3.value = withDelay(INITIAL_DELAY + 200, withTiming(0, config));

    opacity1.value = withDelay(INITIAL_DELAY, withTiming(1, { duration: 50 }));
    opacity2.value = withDelay(
      INITIAL_DELAY + 100,
      withTiming(1, { duration: 50 }),
    );
    opacity3.value = withDelay(
      INITIAL_DELAY + 200,
      withTiming(1, { duration: 50 }),
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX1.value }],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX2.value }],
    opacity: opacity2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX3.value }],
    opacity: opacity3.value,
  }));

  const handleDownloadApp = () => {
    if (ReactNativeAppClip.isClip()) {
      console.log("Clip worked");
      ReactNativeAppClip.displayOverlay();
    } else {
      console.log("Clip didn't work");
      void Linking.openURL("https://apps.apple.com/app/6736484676");
    }
  };

  return (
    <View flex={1} backgroundColor="#F214FF">
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="flex-start"
        gap={"$0"}
        paddingLeft={"$4"}
      >
        <AnimatedText style={animatedStyle1}>YOU'VE</AnimatedText>
        <AnimatedText style={animatedStyle2}>BEEN</AnimatedText>
        <AnimatedText style={animatedStyle3}>OPPED</AnimatedText>
      </YStack>
    </View>
  );
}
