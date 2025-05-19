import React from "react";
import { Dimensions, Image, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
// import all the images from the assets folder in onboarding one by one
import Opp1 from "@assets/onboarding/opp-1.jpg";
import Opp2 from "@assets/onboarding/opp-2.jpg";
import Opp3 from "@assets/onboarding/opp-3.jpg";
import Opp4 from "@assets/onboarding/opp-4.jpg";
import Opp5 from "@assets/onboarding/opp-5.jpg";
import Opp6 from "@assets/onboarding/opp-6.jpg";
import Opp7 from "@assets/onboarding/opp-7.jpg";
import Pop1 from "@assets/onboarding/pop-1.jpg";
import Pop2 from "@assets/onboarding/pop-2.jpg";
import Pop3 from "@assets/onboarding/pop-3.jpg";
import Pop4 from "@assets/onboarding/pop-4.jpg";
import Pop6 from "@assets/onboarding/pop-6.jpg";
import Pop8 from "@assets/onboarding/pop-8.jpg";
import { Stack, Text, View, XStack, YStack } from "tamagui";

import { ScreenView } from "~/components/ui";
import { OnboardingButton } from "~/components/ui/Onboarding";
import { usePermissions } from "~/contexts/PermissionsContext";

export default function Screen1() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;
  const { width, height } = Dimensions.get("window");

  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/tutorial/screen1");
  };

  // All images to be used in the collage
  const images = [
    Opp1,
    Opp2,
    Opp3,
    Opp4,
    Opp5,
    Opp6,
    Opp7,
    Pop1,
    Pop2,
    Pop3,
    Pop4,
    Pop6,
    Pop8,
  ];

  return (
    <ScreenView padding={0} safeAreaEdges={["bottom"]}>
      <YStack flex={1} justifyContent="center" alignItems="center">
        {/* Full background collage with randomized images */}
        <View style={styles.collageContainer}>
          {images.map((img, index) => {
            // Generate semi-random positions, rotations, and sizes
            const left = Math.random() * 0.8 * width;
            const top = Math.random() * 0.8 * height;
            const rotate = Math.random() * 40 - 20;
            const size = 100 + Math.random() * 80;

            return (
              <Image
                key={index}
                source={img}
                style={[
                  styles.collageImage,
                  {
                    left,
                    top,
                    width: size,
                    height: size,
                    transform: [{ rotate: `${rotate}deg` }],
                    zIndex: index,
                  },
                ]}
                resizeMode="cover"
              />
            );
          })}
        </View>

        {/* Gradient Overlay and Text/Button */}
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
              <View
                width="100%"
                paddingHorizontal={24}
                // justifyContent="center"
              >
                <OnboardingButton onPress={onSubmit} isValid text="next" />
              </View>
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
  collageImage: {
    position: "absolute",
    borderRadius: 8,
    opacity: 0.9,
  },
});
