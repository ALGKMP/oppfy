import React, { useEffect } from "react";
import { Animated, Dimensions, Image, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
// import all the images from the assets folder in onboarding one by one
import Opp4 from "@assets/onboarding/opp-4.jpg";
import Opp7 from "@assets/onboarding/opp-7.jpg";
import Pop1 from "@assets/onboarding/pop-1.jpg";
import Pop2 from "@assets/onboarding/pop-2.jpg";
import Pop8 from "@assets/onboarding/pop-8.jpg";
import { Text, View, YStack } from "tamagui";

import { ScreenView } from "~/components/ui";
import { OnboardingButton } from "~/components/ui/Onboarding";
import { usePermissions } from "~/contexts/PermissionsContext";

export default function Screen1() {
  const router = useRouter();
  const { permissions } = usePermissions();

  // Create animated values for each image
  const pop1Anim = React.useRef(new Animated.Value(0)).current;
  const pop8Anim = React.useRef(new Animated.Value(0)).current;
  const opp7Anim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate images in sequence
    Animated.sequence([
      // Initial delay
      Animated.delay(500),
      // Pop1 animation
      Animated.timing(pop1Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Pop8 animation
      Animated.timing(pop8Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Opp7 animation
      Animated.timing(opp7Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Add delay after animations
      Animated.delay(1000),
    ]).start(() => {
      // Route to next screen after animations complete
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      router.push("/tutorial/screen1");
    });
  }, []);

  return (
    <ScreenView padding={0} safeAreaEdges={["bottom"]}>
      <YStack flex={1} justifyContent="center" alignItems="center">
        {/* Full background collage with randomized images */}
        <View style={styles.collageContainer}>
          {/* Hardcoded positions, sizes, and rotations for each image to match the screenshot */}
          <Image
            source={Pop2}
            style={[
              {
                position: "absolute",
                left: 150,
                top: 50,
                width: 300,
                height: 500,
                borderRadius: 20,
                borderWidth: 5,
                borderColor: "white",
                transform: [{ rotate: "6deg" }],
                zIndex: 1,
              },
            ]}
          />
          {/* Animated Pop1 */}
          <Animated.Image
            source={Pop1}
            resizeMode="cover"
            style={[
              {
                position: "absolute",
                left: 20,
                top: 100,
                width: 300,
                height: 500,
                borderRadius: 20,
                borderWidth: 5,
                borderColor: "white",
                transform: [
                  { rotate: "-5deg" },
                  {
                    translateY: pop1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: pop1Anim,
                zIndex: 2,
              },
            ]}
          />
          {/* Animated Pop8 */}
          <Animated.Image
            source={Pop8}
            style={[
              {
                position: "absolute",
                top: 150,
                left: 100,
                width: 300,
                height: 600,
                borderRadius: 20,
                borderWidth: 5,
                borderColor: "white",
                transform: [
                  { rotate: "6deg" },
                  {
                    translateY: pop8Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: pop8Anim,
                zIndex: 3,
              },
            ]}
          />
          {/* Animated Opp7 */}
          <Animated.Image
            source={Opp7}
            style={[
              {
                position: "absolute",
                top: 250,
                left: 25,
                width: 350,
                height: 550,
                borderRadius: 20,
                borderWidth: 5,
                borderColor: "white",
                transform: [
                  { rotate: "-6deg" },
                  {
                    translateY: opp7Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: opp7Anim,
                zIndex: 3,
              },
            ]}
          />
        </View>

        {/* Gradient Overlay and Text */}
        <YStack
          position="absolute"
          bottom={0}
          width="100%"
          height="100%"
          justifyContent="flex-end"
        >
          <LinearGradient
            colors={["transparent", "#F214FF"]}
            locations={[0.6, 1.0]}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <YStack paddingBottom={40} alignItems="center">
              <Text
                fontSize={32}
                fontWeight="bold"
                color="white"
                textAlign="center"
                marginBottom={40}
              >
                post for your friends
              </Text>
            </YStack>
          </LinearGradient>
        </YStack>
      </YStack>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  collageContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
});
