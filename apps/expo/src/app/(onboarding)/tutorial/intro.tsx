import React, { useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, StatusBar, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { Text, View, YStack } from "~/components/ui";
import { OnboardingButton, OnboardingScreen } from "~/components/ui/Onboarding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Message {
  id: number;
  text: string;
  type: "system" | "friend" | "you" | "preview";
  image?: string;
}

const STORY: Message[] = [
  {
    id: 1,
    type: "system",
    text: "🚨 YOU'VE BEEN OPPED!",
  },
  {
    id: 2,
    type: "preview",
    text: "Sarah's first post\nOpped by @alex",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    type: "friend",
    text: "ALEX I WILL END YOU 💀",
  },
  {
    id: 4,
    type: "you",
    text: "karaoke night memories needed to be shared 😈",
  },
];

const MessageBubble = ({ message }: { message: Message }) => {
  const isSystem = message.type === "system";
  const isFriend = message.type === "friend";
  const isPreview = message.type === "preview";
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.05, { mass: 0.3, stiffness: 300 }),
      withSpring(1, { mass: 0.3, stiffness: 300 }),
    );
    void Haptics.impactAsync(
      isSystem || isPreview
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isPreview) {
    return (
      <Animated.View
        style={[
          style,
          {
            alignSelf: "center",
            width: SCREEN_WIDTH * 0.85,
            marginVertical: 8,
            marginHorizontal: 12,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "$gray3",
          },
        ]}
      >
        <Image
          source={{ uri: message.image }}
          style={{ width: "100%", height: SCREEN_WIDTH * 0.85 }}
          contentFit="cover"
        />
        <YStack padding="$4" gap="$1">
          <Text fontSize="$4" color="$gray11">
            {message.text.split("\n")[0]}
          </Text>
          <Text fontSize="$4" color="$primary" fontWeight="bold">
            {message.text.split("\n")[1]}
          </Text>
        </YStack>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        style,
        {
          alignSelf: isFriend
            ? "flex-start"
            : message.type === "you"
              ? "flex-end"
              : "center",
          maxWidth: "80%",
          marginVertical: 6,
          marginHorizontal: 16,
        },
      ]}
    >
      <View
        backgroundColor={isSystem ? "$gray3" : isFriend ? "$gray3" : "#007AFF"}
        padding="$4"
        borderRadius={20}
        borderTopLeftRadius={isFriend ? 6 : 20}
        borderTopRightRadius={message.type === "you" ? 6 : 20}
      >
        <Text
          color={isFriend || isSystem ? "$color" : "white"}
          fontSize={isSystem ? "$6" : "$5"}
          textAlign={isSystem ? "center" : "left"}
          fontWeight={isSystem ? "900" : "600"}
          lineHeight={24}
        >
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
};

const ChatExperience = ({ onComplete }: { onComplete: () => void }) => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    StatusBar.setBarStyle("light-content");

    // Show messages rapid-fire
    STORY.forEach((message, index) => {
      setTimeout(() => {
        setVisibleMessages((prev) => [...prev, message]);
        scrollViewRef.current?.scrollToEnd({ animated: true });

        // Complete after last message
        if (index === STORY.length - 1) {
          setTimeout(onComplete, 800);
        }
      }, index * 800); // Slightly slower timing for readability
    });

    return () => {
      StatusBar.setBarStyle("default");
    };
  }, []);

  return (
    <View flex={1} backgroundColor="#000000">
      <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(200)}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$2">
            {visibleMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </YStack>
        </ScrollView>
      </Animated.View>
    </View>
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
      title="Time to Get Revenge 😈"
      subtitle="Your friends won't know what hit them"
      footer={
        <OnboardingButton
          onPress={handleStart}
          text="Let's Start Some Drama! 🎯"
        />
      }
    >
      <YStack
        flex={1}
        justifyContent="center"
        gap="$6"
        paddingHorizontal="$4"
        alignItems="center"
      >
        <Animated.View
          entering={SlideInUp.delay(200)}
          style={{ width: SCREEN_WIDTH * 0.8, height: SCREEN_WIDTH * 0.5 }}
        >
          <Image
            source={{
              uri: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXJ5ZnJ1ZHpxdWRmcnVkenFkcXVkenFkcXVkenFmcnVmcnVmcnVmciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5xaOcLGvzHxDKjufnLW/giphy.gif",
            }}
            style={{ width: "100%", height: "100%" }}
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
              Create profiles for your unsuspecting friends
            </Text>
          </Animated.View>
          <Animated.View entering={SlideInUp.delay(600)}>
            <Text color="$gray11" fontSize="$6" textAlign="center">
              Post their most embarrassing moments...{"\n"}
              Before they can stop you 🤫
            </Text>
          </Animated.View>
          <Animated.View entering={SlideInUp.delay(800)}>
            <Text
              color="$primary"
              fontSize="$5"
              textAlign="center"
              fontWeight="bold"
            >
              Don't worry, they'll get you back 😈
            </Text>
          </Animated.View>
        </YStack>
      </YStack>
    </OnboardingScreen>
  );
};

const Intro = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  const handleChatComplete = () => {
    setShowWelcome(true);
  };

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return <ChatExperience onComplete={handleChatComplete} />;
};

export default Intro;
