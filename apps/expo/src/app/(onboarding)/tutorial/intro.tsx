import React, { useEffect } from "react";
import { Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import { Camera, MessageCircle, Share2 } from "@tamagui/lucide-icons";

import {
  H1,
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
const PREVIEW_WIDTH = SCREEN_WIDTH - 64;
const PREVIEW_HEIGHT = (PREVIEW_WIDTH * 16) / 9;

const STEPS = [
  {
    icon: Camera,
    title: "Take a Photo",
    description: "Capture a moment or choose from your gallery",
  },
  {
    icon: MessageCircle,
    title: "Add a Message",
    description: "Write something fun to share with your friend",
  },
  {
    icon: Share2,
    title: "Share Instantly",
    description: "Send it to your friend, even if they're not on Oppfy yet",
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

  const handleContinue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/tutorial/select");
  };

  return (
    <ScreenView padding="$0" justifyContent="space-between">
      <LinearGradient
        colors={["$primary", "$background"]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <YStack flex={1} paddingHorizontal="$4" gap="$6" paddingTop="$8">
        <YStack gap="$2" animation="quick" enterStyle={{ opacity: 0, y: -20 }}>
          <H1 textAlign="center" color="$color">
            Let's Create Your{"\n"}First Post!
          </H1>
          <Paragraph textAlign="center" color="$gray11">
            We'll walk you through creating and sharing your first moment
          </Paragraph>
        </YStack>

        {/* Preview Example */}
        <View
          backgroundColor="$backgroundTransparent"
          borderRadius="$6"
          overflow="hidden"
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
          }}
        >
          {/* <Image
            source={require("~/assets/images/tutorial-preview.png")}
            style={{
              width: PREVIEW_WIDTH,
              height: PREVIEW_HEIGHT,
              borderRadius: 16,
            }}
            contentFit="cover"
          /> */}
          <View
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            padding="$4"
            backgroundColor="$backgroundTransparent"
            borderTopWidth={1}
            borderTopColor="$borderColor"
          >
            <Text color="$color" fontSize="$4">
              Your friend will capture moments like this for you
            </Text>
          </View>
        </View>

        {/* Steps List */}
        <YStack gap="$4">
          {STEPS.map((step, index) => (
            <XStack
              key={step.title}
              backgroundColor="$gray3"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$5"
              borderRadius="$6"
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
              <View
                backgroundColor="$primary"
                padding="$3"
                borderRadius="$4"
                opacity={0.9}
              >
                <step.icon size={24} color="$color" />
              </View>
              <YStack flex={1}>
                <Text fontWeight="bold" fontSize="$5" color="$color">
                  {step.title}
                </Text>
                <Text color="$gray11" fontSize="$3">
                  {step.description}
                </Text>
              </YStack>
            </XStack>
          ))}
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
          icon={Camera}
          onPress={handleContinue}
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
            y: 20,
          }}
        >
          Let's Start
        </OnboardingButton>
      </YStack>
    </ScreenView>
  );
};

export default Intro;
