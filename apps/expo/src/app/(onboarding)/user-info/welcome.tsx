import React, { useEffect } from "react";
import { TouchableOpacity, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { SplashScreen, useNavigation, useRouter } from "expo-router";
import { AnimatePresence } from "@tamagui/animate-presence";
import { LinearGradient } from "@tamagui/linear-gradient";
import { ArrowRight, Sparkles, X } from "@tamagui/lucide-icons";

import {
  Circle,
  H1,
  OnboardingButton,
  Paragraph,
  ScreenView,
  Text,
  useAlertDialogController,
  XStack,
  YStack,
} from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";

const Welcome = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const alertDialog = useAlertDialogController();
  const { signOut } = useSession();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          hitSlop={10}
          onPress={async () => {
            const confirmed = await alertDialog.show({
              title: "Exit Onboarding",
              subtitle:
                "Are you sure you want to quit? You'll lose any changes you've made.",
              acceptText: "Exit",
              cancelText: "Cancel",
            });

            if (confirmed) {
              await signOut();
            }
          }}
        >
          <X color="$gray11" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, signOut, alertDialog]);

  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/user-info/name");
  };

  useEffect(() => void SplashScreen.hideAsync(), []);

  return (
    <ScreenView
      backgroundColor="$background"
      paddingBottom={0}
      safeAreaEdges={["bottom"]}
      justifyContent="space-between"
      animation="bouncy"
    >
      <YStack
        flex={1}
        gap="$8"
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="$4"
      >
        <AnimatePresence>
          {/* Main Content */}
          <YStack
            animation="bouncy"
            enterStyle={{
              y: 20,
              opacity: 0,
            }}
            y={0}
            opacity={1}
            gap="$12"
            maxWidth={600}
            alignItems="center"
          >
            {/* Icon */}
            <YStack
              animation="bouncy"
              enterStyle={{ scale: 0.8, opacity: 0 }}
              pressStyle={{ scale: 0.97 }}
            >
              <Circle
                size={width * 0.38}
                backgroundColor="$background"
                borderWidth={1.5}
                borderColor="$primary"
                shadowColor="$primary"
                shadowOpacity={0.15}
                shadowRadius={40}
                pressStyle={{
                  scale: 1.02,
                  backgroundColor: "$backgroundHover",
                }}
              >
                <Circle
                  size={width * 0.32}
                  backgroundColor="$background"
                  borderWidth={1.5}
                  borderColor="$primary"
                  opacity={0.7}
                >
                  <Circle
                    size={width * 0.2}
                    backgroundColor="$primary"
                    shadowColor="$primary"
                    shadowOpacity={0.5}
                    shadowRadius={20}
                  >
                    <Sparkles size={width * 0.1} color="white" />
                  </Circle>
                </Circle>
              </Circle>
            </YStack>

            {/* Text Content */}
            <YStack gap="$4" alignItems="center">
              <H1
                textAlign="center"
                color="$gray12"
                size="$9"
                letterSpacing={-1}
                animation="bouncy"
                enterStyle={{ y: -20, opacity: 0 }}
              >
                Hi there!
              </H1>

              <Paragraph
                textAlign="center"
                color="$gray11"
                size="$6"
                maxWidth={320}
                animation="bouncy"
              >
                Let's get your profile set up in just a few quick steps
              </Paragraph>
            </YStack>
          </YStack>
        </AnimatePresence>
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onSubmit}
        // animation="bouncy"
        // enterStyle={{
        //   y: 20,
        //   opacity: 0,
        // }}
        // y={0}
        // opacity={1}
        // backgroundColor="$primary"
        // pressStyle={{
        //   opacity: 0.9,
        //   scale: 0.98,
        // }}
        // scale={1}
        // shadowColor="$primary"
        // shadowOpacity={0.2}
        // shadowRadius={20}
      >
        {/* <XStack gap="$3" alignItems="center">
          <Text color="white" fontWeight="600" fontSize="$6"> */}
            Get Started
          {/* </Text>
          <ArrowRight size={20} color="white" />
        </XStack> */}
      </OnboardingButton>
    </ScreenView>
  );
};

export default Welcome;
