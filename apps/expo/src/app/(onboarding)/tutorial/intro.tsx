import React, { useEffect, useMemo, useState } from "react";
import { Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";

import {
  H1,
  Icon,
  OnboardingButton,
  ScreenView,
  Text,
  useAlertDialogController,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PREVIEW_WIDTH = SCREEN_WIDTH - 64;
const GIF_WIDTH = PREVIEW_WIDTH * 0.8; // Make GIF smaller than full width

const STEPS = [
  {
    icon: "📸",
    title: "Take a Photo",
    description: "Capture a moment or choose from your gallery",
  },
  {
    icon: "💭",
    title: "Add a Caption",
    description: "Write something fun to share with your friend",
  },
  {
    icon: "✨",
    title: "Share Instantly",
    description: "Send it to your friend, even if they're not on Oppfy yet",
  },
];

const WELCOME_GIFS = [
  // TODO: Make our own Oppfy welcome gif
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGI2ajZvdm9ycTkxYXh3djhsbGM3bm1rcXlyeXR1YXc0bjFua2dycCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/FQyQEYd0KlYQ/giphy.gif", // Welcome Aboard
  "https://media.giphy.com/media/XD9o33QG9BoMis7iM4/giphy.gif", // B 99
  "https://media.giphy.com/media/l4JyOCNEfXvVYEqB2/giphy.gif", // Welcome To the Club
  "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif", // welcome hand drawn
];

const Intro = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const alertDialog = useAlertDialogController();
  const { signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Select a random welcome GIF on component mount
  const welcomeGif = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * WELCOME_GIFS.length);
    return WELCOME_GIFS[randomIndex];
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Icon
          name="close"
          onPress={async () => {
            const confirmed = await alertDialog.show({
              title: "Exit Tutorial",
              subtitle:
                "Are you sure you want to quit? You're about to create your first post!",
              acceptText: "Exit",
              cancelText: "Stay",
            });

            if (confirmed) {
              signOut();
            }
          }}
          blurred
        />
      ),
    });
  }, [navigation, signOut, alertDialog]);

  const handleNext = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.push("/tutorial/select");
    }
  };

  const isLastStep = currentStep === STEPS.length;

  return (
    <ScreenView padding="$0" justifyContent="space-between">
      <YStack flex={1} paddingHorizontal="$4" gap="$4" paddingTop="$6">
        <YStack gap="$2" animation="quick" enterStyle={{ opacity: 0, y: -20 }}>
          <H1 textAlign="center" color="$color">
            Let's Create Your{"\n"}First Post!
          </H1>
        </YStack>

        {/* Welcome GIF */}
        <View
          backgroundColor="$backgroundTransparent"
          borderRadius="$6"
          overflow="hidden"
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
          }}
          alignSelf="center"
        >
          <Image
            source={{ uri: welcomeGif }}
            style={{
              width: GIF_WIDTH,
              height: GIF_WIDTH * 0.6, // Make height proportionally smaller
              borderRadius: 16,
            }}
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* Steps List */}
        <YStack gap="$3" minHeight={240}>
          {STEPS.map(
            (step, index) =>
              index < currentStep && (
                <XStack
                  key={step.title}
                  backgroundColor="$gray3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  padding="$2"
                  borderRadius="$6"
                  gap="$4"
                  alignItems="center"
                  animation="quick"
                  enterStyle={{
                    opacity: 0,
                    scale: 0.9,
                    y: 10,
                  }}
                >
                  <View
                    padding="$3"
                    borderRadius="$4"
                    opacity={0.9}
                  >
                    <Text fontSize={50}>{step.icon}</Text>
                  </View>
                  <YStack flex={1}>
                    <Text fontWeight="bold" fontSize="$8" color="$color">
                      {step.title}
                    </Text>
                    <Text color="$gray11" fontSize="$5">
                      {step.description}
                    </Text>
                  </YStack>
                </XStack>
              ),
          )}
        </YStack>
      </YStack>

      {/* Bottom Button */}
      <YStack
        paddingBottom="$6"
        backgroundColor="$backgroundTransparent"
        borderTopWidth={1}
        borderTopColor="$borderColor"
      >
        <OnboardingButton
          onPress={handleNext}
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
            y: 20,
          }}
        >
          {isLastStep ? "Let's Start" : "Next"}
        </OnboardingButton>
      </YStack>
    </ScreenView>
  );
};

export default Intro;
