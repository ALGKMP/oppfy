import React, { useEffect } from "react";
import { Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SplashScreen, useNavigation, useRouter } from "expo-router";
import { ArrowRight, Share2, UserPlus2 } from "@tamagui/lucide-icons";

import {
  H1,
  H3,
  Icon,
  OnboardingButton,
  Paragraph,
  ScreenView,
  Text,
  useAlertDialogController,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";

const SCREEN_WIDTH = Dimensions.get("window").width;
const FEATURE_IMAGE_SIZE = SCREEN_WIDTH - 64;

const FEATURES = [
  {
    icon: Share2,
    title: "Share Instantly",
    description:
      "Share photos and videos with friends, even if they're not on Oppfy yet",
  },
  {
    icon: UserPlus2,
    title: "Invite Friends",
    description:
      "Your friends will get a special invite to join when you share with them",
  },
];

const Intro = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const alertDialog = useAlertDialogController();
  const { signOut } = useAuth();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Icon
          name="close"
          onPress={async () => {
            const confirmed = await alertDialog.show({
              title: "Exit Tutorial",
              subtitle:
                "Are you sure you want to quit? You're about to learn an amazing feature!",
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

  const handleContinue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/tutorial/select");
  };

  return (
    <ScreenView
      backgroundColor="$background"
      padding="$0"
      justifyContent="space-between"
    >
      <YStack flex={1} paddingHorizontal="$4" gap="$6" paddingTop="$8">
        <YStack gap="$2">
          <H1 textAlign="center" color="$primary">
            Share with Anyone
          </H1>
          <Paragraph textAlign="center" color="$gray11">
            Share amazing moments with your friends, even if they haven't joined
            Oppfy yet
          </Paragraph>
        </YStack>

        {/* Feature Image */}
        <View
          backgroundColor="$gray3"
          borderRadius="$10"
          padding="$6"
          alignItems="center"
          marginTop="$4"
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
          }}
        >
          {/* <Image
            source={require("~/assets/images/share-illustration.png")}
            style={{
              width: FEATURE_IMAGE_SIZE,
              height: FEATURE_IMAGE_SIZE,
              borderRadius: 24,
            }}
            contentFit="cover"
          /> */}
        </View>

        {/* Features List */}
        <YStack gap="$4" paddingTop="$4">
          {FEATURES.map((feature, index) => (
            <XStack
              key={feature.title}
              backgroundColor="$gray3"
              padding="$4"
              borderRadius="$4"
              gap="$4"
              alignItems="center"
              animation="quick"
              enterStyle={{
                opacity: 0,
                scale: 0.9,
                y: 10,
              }}
              animation-delay={`${index * 200}ms`}
            >
              <feature.icon size={24} color="$primary" />
              <YStack flex={1}>
                <Text fontWeight="bold" fontSize="$5">
                  {feature.title}
                </Text>
                <Text color="$gray11" fontSize="$3">
                  {feature.description}
                </Text>
              </YStack>
            </XStack>
          ))}
        </YStack>
      </YStack>

      {/* Bottom Button */}
      <YStack
        padding="$4"
        paddingBottom="$6"
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$gray5"
      >
        <OnboardingButton
          icon={ArrowRight}
          onPress={handleContinue}
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
            y: 20,
          }}
        >
          Let's Try It
        </OnboardingButton>
      </YStack>
    </ScreenView>
  );
};

export default Intro;
