import React, { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import Animated, { SlideInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { Text, YStack } from "~/components/ui";
import type { MessageProps } from "~/components/ui/Messages/Message";
import { MessageList } from "~/components/ui/Messages/MessageList";
import { OnboardingButton, OnboardingScreen } from "~/components/ui/Onboarding";
import useContacts from "~/hooks/contacts/useContacts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MESSAGES = (contactName: string, contactImage?: string) =>
  [
    {
      id: 1,
      type: "system",
      text: "🚨 VIOLATION ALERT 🚨",
      animation: {
        isSpecial: true,
        delay: 500,
        duration: 800,
        hapticFeedback: "heavy",
      },
    },
    {
      id: 2,
      type: "you",
      text: "YO CHECK THIS OUT 💀",
      animation: {
        isShook: true,
        delay: 400,
        duration: 600,
        hapticFeedback: "medium",
      },
    },
    {
      id: 3,
      type: "friend",
      text: "what did u do... 😭",
      animation: {
        delay: 500,
        duration: 600,
        hapticFeedback: "light",
      },
    },
    {
      id: 4,
      type: "you",
      text: "made u an oppfy profile with THAT video 😈",
      animation: {
        isShook: true,
        delay: 400,
        duration: 700,
        hapticFeedback: "medium",
      },
    },
    {
      id: 5,
      type: "preview",
      text: `${contactName}'s first post\nOpped by @you 🫣`,
      author: {
        name: contactName,
        avatar: contactImage,
      },
      media: {
        type: "gif",
        url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzM5YTBjMzY2ZmQ5ZmE4ZWM4ZjFkYzM5ZDM4ZjM2ZjM1ZTI1ZjE4YyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/E1w0yvMxBIv5M8WkL8/giphy.gif",
        aspectRatio: 0.7,
      },
      animation: {
        isSpecial: true,
        delay: 800,
        duration: 1200,
        hapticFeedback: "heavy",
      },
    },
    {
      id: 6,
      type: "friend",
      text: "NAHHHH WTFFFFF 💀💀💀",
      animation: {
        isAngry: true,
        delay: 500,
        duration: 800,
        hapticFeedback: "heavy",
      },
    },
    {
      id: 7,
      type: "friend",
      text: "DELETE THIS RN OR UR DEAD FR",
      animation: {
        isAngry: true,
        delay: 300,
        duration: 600,
        hapticFeedback: "heavy",
      },
    },
    {
      id: 8,
      type: "you",
      text: "everyone needs to see this masterpiece fr fr 🔥",
      animation: {
        isShook: true,
        delay: 500,
        duration: 800,
        hapticFeedback: "medium",
      },
    },
  ] satisfies MessageProps[];

interface ChatExperienceProps {
  onComplete: () => void;
}

const ChatExperience = ({ onComplete }: ChatExperienceProps) => {
  const { getDeviceContactsNotOnApp } = useContacts();

  const [story, setStory] = useState<MessageProps[]>(MESSAGES("Friend"));

  useEffect(() => {
    const initializeStory = async () => {
      const contacts = await getDeviceContactsNotOnApp();
      const bestContact = contacts.find((c) => c.imageAvailable) ?? contacts[0];

      if (bestContact === undefined) {
        setStory(MESSAGES("Friend"));
        return;
      }

      setStory(MESSAGES(bestContact.name, bestContact.image?.uri));
    };

    void initializeStory();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!story.length) return null;

  return (
    <MessageList messages={story} onAnimationComplete={onComplete} autoScroll />
  );
};

const WelcomeScreen = () => {
  const router = useRouter();

  const handleStart = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/tutorial/select-contact");
  };

  return (
    <OnboardingScreen
      title="Your Friends Won't See This Coming 🤫"
      subtitle="It's about to get real interesting"
      footer={
        <OnboardingButton
          onPress={handleStart}
          text="Time to Choose Violence 😈"
        />
      }
    >
      <YStack
        justifyContent="center"
        gap="$6"
        paddingHorizontal="$4"
        alignItems="center"
      >
        <Animated.View
          entering={SlideInUp.delay(200)}
          style={{ width: SCREEN_WIDTH * 0.85, height: SCREEN_WIDTH * 0.6 }}
        >
          <Image
            source={{
              uri: "https://media.tenor.com/dB5dAKM1B4sAAAAM/bad-evil-laugh.gif",
            }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
            }}
            contentFit="cover"
          />
        </Animated.View>
        <YStack gap="$4" alignItems="center">
          <Animated.View entering={SlideInUp.delay(400)}>
            <Text
              color="white"
              fontSize="$7"
              textAlign="center"
              fontWeight="bold"
            >
              Share their most questionable moments
            </Text>
          </Animated.View>
        </YStack>
      </YStack>
    </OnboardingScreen>
  );
};

const Intro = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return <ChatExperience onComplete={() => setShowWelcome(true)} />;
};

export default Intro;
