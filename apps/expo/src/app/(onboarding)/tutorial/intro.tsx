import React, { useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, StatusBar } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { Text, View, YStack } from "~/components/ui";
import { OnboardingButton, OnboardingScreen } from "~/components/ui/Onboarding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Message {
  id: number;
  text: string;
  type: "system" | "friend" | "you";
  showTyping?: boolean;
  typingDuration?: number;
  isEmphasis?: boolean;
}

const STORY: Message[] = [
  {
    id: 1,
    type: "system",
    text: "🚨 YOU'VE BEEN OPPED! 🚨",
    isEmphasis: true,
  },
  {
    id: 2,
    type: "system",
    text: "Someone just created your Oppfy profile and posted that pic from last weekend... 👀",
  },
  {
    id: 3,
    type: "friend",
    text: "EXCUSE ME WHAT",
    showTyping: true,
    typingDuration: 800,
    isEmphasis: true,
  },
  {
    id: 4,
    type: "friend",
    text: "I DONT EVEN HAVE OPPFY YET???",
    showTyping: true,
    typingDuration: 1000,
    isEmphasis: true,
  },
  {
    id: 5,
    type: "friend",
    text: "wait...",
    showTyping: true,
    typingDuration: 800,
  },
  {
    id: 6,
    type: "friend",
    text: "IS THIS FROM KARAOKE NIGHT",
    showTyping: true,
    typingDuration: 1000,
    isEmphasis: true,
  },
  {
    id: 7,
    type: "you",
    text: "the world needed to see your rendition of Dancing Queen 😈🎤",
  },
  {
    id: 8,
    type: "friend",
    text: "I CANT BELIEVE YOU",
    showTyping: true,
    typingDuration: 800,
    isEmphasis: true,
  },
  {
    id: 9,
    type: "friend",
    text: "...actually it is kinda funny tho 😭",
    showTyping: true,
    typingDuration: 1200,
  },
  {
    id: 10,
    type: "friend",
    text: "but just wait til i make YOUR profile 😈",
    showTyping: true,
    typingDuration: 1000,
  },
  {
    id: 11,
    type: "friend",
    text: "i still have the vid from the beach incident 📸",
    showTyping: true,
    typingDuration: 1200,
  },
];

interface MessageBubbleProps {
  message: Message;
  isTyping?: boolean;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const MessageBubble = ({ message, isTyping = false }: MessageBubbleProps) => {
  const isSystem = message.type === "system";
  const isFriend = message.type === "friend";
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { mass: 0.5, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 150 });

    if (message.isEmphasis) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      shake.value = withSpring(1, { mass: 0.5, stiffness: 200 });
    } else if (isTyping) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (isSystem) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shake.value * Math.sin(Date.now() * 0.01) * 2 },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          alignSelf: isFriend
            ? "flex-start"
            : message.type === "you"
              ? "flex-end"
              : "center",
          maxWidth: isSystem ? "90%" : "75%",
          marginVertical: 4,
          marginHorizontal: 12,
        },
      ]}
    >
      <View
        backgroundColor={isSystem ? "$gray3" : isFriend ? "$gray3" : "$primary"}
        padding="$3"
        paddingVertical={isSystem ? "$4" : "$3"}
        borderRadius="$4"
        borderTopLeftRadius={isFriend ? "$1" : "$4"}
        borderTopRightRadius={message.type === "you" ? "$1" : "$4"}
      >
        {isTyping ? (
          <Text
            color={isFriend ? "$gray11" : "white"}
            fontSize="$3"
            fontStyle="italic"
          >
            typing...
          </Text>
        ) : (
          <Text
            color={isFriend || isSystem ? "$color" : "white"}
            fontSize={message.isEmphasis ? "$6" : isSystem ? "$4" : "$5"}
            textAlign={isSystem ? "center" : "left"}
            fontWeight={
              message.isEmphasis ? "900" : isSystem ? "bold" : "normal"
            }
          >
            {message.text}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const ChatExperience = ({ onComplete }: { onComplete: () => void }) => {
  const [visibleMessages, setVisibleMessages] = useState<
    (Message & { isTyping?: boolean })[]
  >([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const opacity = useSharedValue(0);
  const blurIntensity = useSharedValue(0);

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    opacity.value = withTiming(1, { duration: 300 });
    blurIntensity.value = withTiming(20, { duration: 500 });

    const showMessage = async (message: Message, index: number) => {
      if (message.showTyping) {
        setVisibleMessages((prev) => [...prev, { ...message, isTyping: true }]);
        await new Promise((resolve) =>
          setTimeout(resolve, message.typingDuration),
        );
        setVisibleMessages((prev) => prev.filter((m) => m.id !== message.id));
      }

      setVisibleMessages((prev) => [...prev, message]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      if (index === STORY.length - 1) {
        setTimeout(onComplete, 2000);
      }
    };

    let delay = 500;
    STORY.forEach((message, index) => {
      setTimeout(() => void showMessage(message, index), delay);
      delay += message.showTyping
        ? (message.typingDuration || 1000) + (message.isEmphasis ? 1000 : 500)
        : message.isEmphasis
          ? 2000
          : 1500;
    });

    return () => {
      StatusBar.setBarStyle("default");
    };
  }, []);

  const blurStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    backdropFilter: `blur(${blurIntensity.value}px)`,
  }));

  return (
    <View flex={1} backgroundColor="black">
      <AnimatedBlurView intensity={100} style={blurStyle} />
      <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(400)}>
        <AnimatedScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$2">
            {visibleMessages.map((message) => (
              <MessageBubble
                key={`${message.id}-${message.isTyping ? "typing" : "message"}`}
                message={message}
                isTyping={message.isTyping}
              />
            ))}
          </YStack>
        </AnimatedScrollView>
      </Animated.View>
    </View>
  );
};

const Intro = () => {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  const handleChatComplete = () => {
    setShowWelcome(true);
  };

  const handleStart = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/tutorial/select-contact");
  };

  if (showWelcome) {
    return (
      <OnboardingScreen
        title="Start the Chain Reaction"
        subtitle="Create profiles for your friends and watch the fun begin"
        footer={
          <OnboardingButton
            onPress={handleStart}
            text="Let's Opp Someone! 🎯"
          />
        }
      >
        <YStack
          flex={1}
          justifyContent="center"
          gap="$4"
          paddingHorizontal="$4"
        >
          <Animated.View entering={SlideInUp.delay(200)}>
            <Text color="$gray11" fontSize="$6" textAlign="center">
              Create profiles for your friends...
            </Text>
          </Animated.View>
          <Animated.View entering={SlideInUp.delay(400)}>
            <Text
              color="white"
              fontSize="$7"
              textAlign="center"
              fontWeight="bold"
            >
              Post their most memorable moments
            </Text>
          </Animated.View>
          <Animated.View entering={SlideInUp.delay(600)}>
            <Text color="$gray11" fontSize="$6" textAlign="center">
              And watch the revenge unfold 😈
            </Text>
          </Animated.View>
        </YStack>
      </OnboardingScreen>
    );
  }

  return <ChatExperience onComplete={handleChatComplete} />;
};

export default Intro;
