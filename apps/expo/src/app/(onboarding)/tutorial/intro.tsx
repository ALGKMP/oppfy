import React, { useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, StatusBar, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import type { Contact } from "expo-contacts";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { MotiView } from "moti";
import { getToken } from "tamagui";

import { Text, View, YStack } from "~/components/ui";
import { OnboardingButton, OnboardingScreen } from "~/components/ui/Onboarding";
import useContacts from "~/hooks/contacts/useContacts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Message {
  id: number;
  text: string;
  type: "system" | "friend" | "you" | "preview";
  image?: string;
  timing: {
    delay: number; // How long to wait before showing this message
    duration: number; // How long the message should take to appear
  };
  animation: {
    isAngry?: boolean; // Shake + heavy haptics
    isShook?: boolean; // Bounce effect
    isSpecial?: boolean; // Extra scale effect
  };
}

const createStory = (contact: Contact): Message[] => [
  {
    id: 1,
    type: "system",
    text: "🚨 VIOLATION ALERT 🚨",
    timing: { delay: 500, duration: 800 },
    animation: { isSpecial: true },
  },
  {
    id: 2,
    type: "you",
    text: "YO CHECK THIS OUT 💀",
    timing: { delay: 400, duration: 600 },
    animation: { isShook: true },
  },
  {
    id: 3,
    type: "friend",
    text: "what did u do... 😭",
    timing: { delay: 500, duration: 600 },
    animation: {},
  },
  {
    id: 4,
    type: "you",
    text: "made u an oppfy profile with THAT video 😈",
    timing: { delay: 400, duration: 700 },
    animation: { isShook: true },
  },
  {
    id: 5,
    type: "preview",
    text: `${contact.name}'s first post\nOpped by @you 🫣`,
    image: contact.image?.uri,
    timing: { delay: 800, duration: 1200 },
    animation: { isSpecial: true },
  },
  {
    id: 6,
    type: "friend",
    text: "NAHHHH WTFFFFF 💀💀💀",
    timing: { delay: 500, duration: 800 },
    animation: { isAngry: true },
  },
  {
    id: 7,
    type: "friend",
    text: "DELETE THIS RN OR UR DEAD FR",
    timing: { delay: 300, duration: 600 },
    animation: { isAngry: true },
  },
  {
    id: 8,
    type: "you",
    text: "everyone needs to see this masterpiece fr fr 🔥",
    timing: { delay: 500, duration: 800 },
    animation: { isShook: true },
  },
];

const MessageBubble = ({ message }: { message: Message }) => {
  const isSystem = message.type === "system";
  const isFriend = message.type === "friend";
  const isPreview = message.type === "preview";

  const scale = useSharedValue(0.8);
  const slideY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    // Base animations
    opacity.value = withTiming(1, { duration: message.timing.duration / 2 });
    slideY.value = withSpring(0, {
      mass: 0.3,
      stiffness: message.animation.isAngry ? 400 : 300,
      damping: message.animation.isAngry ? 12 : 20,
    });

    // Scale animation based on type
    if (message.animation.isSpecial) {
      scale.value = withSequence(
        withSpring(1.2, { mass: 0.3, stiffness: 400 }),
        withSpring(1, { mass: 0.3, stiffness: 400 }),
      );
    } else if (message.animation.isShook) {
      scale.value = withSequence(
        withSpring(1.1, { mass: 0.3, stiffness: 400 }),
        withSpring(1, { mass: 0.3, stiffness: 400 }),
      );
    } else {
      scale.value = withSpring(1, { mass: 0.3, stiffness: 300 });
    }

    // Shake animation for angry messages
    if (message.animation.isAngry) {
      shake.value = withSequence(
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (message.animation.isShook) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: slideY.value },
      { translateX: shake.value },
    ],
    opacity: opacity.value,
  }));

  if (isPreview) {
    return (
      <Animated.View
        style={[
          style,
          {
            alignSelf: "center",
            width: SCREEN_WIDTH * 0.85,
            marginVertical: 12,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "#1A1A1A",
          },
        ]}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={{
              uri: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzM5YTBjMzY2ZmQ5ZmE4ZWM4ZjFkYzM5ZDM4ZjM2ZjM1ZTI1ZjE4YyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/E1w0yvMxBIv5M8WkL8/giphy.gif",
            }}
            style={{ width: "100%", height: SCREEN_WIDTH * 0.6 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.9)", "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 80,
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
            }}
          >
            <Image
              source={
                message.image ? { uri: message.image } : DefaultProfilePicture
              }
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                marginRight: 12,
                borderWidth: 2,
                borderColor: "#007AFF",
              }}
            />
            <Text color="white" fontSize={18} fontWeight="bold">
              {message.text.split("\n")[0]}
            </Text>
          </LinearGradient>
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              backgroundColor: "rgba(0,0,0,0.8)",
            }}
          >
            <Text color="#007AFF" fontSize={16} fontWeight="bold">
              {message.text.split("\n")[1]}
            </Text>
          </View>
        </View>
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
          maxWidth: isSystem ? "90%" : "70%",
          marginVertical: 4,
          marginHorizontal: 12,
        },
      ]}
    >
      <View
        style={{
          backgroundColor: isSystem
            ? "transparent"
            : isFriend
              ? "#1A1A1A"
              : "#007AFF",
          padding: 16,
          paddingVertical: isSystem ? 12 : 16,
          borderRadius: 20,
          borderTopLeftRadius: isFriend ? 6 : 20,
          borderTopRightRadius: message.type === "you" ? 6 : 20,
        }}
      >
        <Text
          style={{
            color: isFriend ? "#FFFFFF" : isSystem ? "#FFFFFF" : "#FFFFFF",
            fontSize: isSystem ? 24 : 16,
            textAlign: isSystem ? "center" : "left",
            fontWeight: isSystem ? "900" : "600",
            lineHeight: 24,
          }}
        >
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
};

const ChatExperience = ({ onComplete }: { onComplete: () => void }) => {
  const insets = useSafeAreaInsets();

  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [story, setStory] = useState<Message[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { getDeviceContactsNotOnApp } = useContacts();

  useEffect(() => {
    const initializeStory = async () => {
      try {
        const contacts = await getDeviceContactsNotOnApp();
        const bestContact =
          contacts.find((c) => c.imageAvailable) ?? contacts[0];
        if (bestContact) {
          setStory(createStory(bestContact));
        }
      } catch (error) {
        console.error(error);
        setStory(createStory({ name: "Sarah" } as Contact));
      }
    };

    void initializeStory();
  }, []);

  useEffect(() => {
    if (story.length === 0) return;

    StatusBar.setBarStyle("light-content");
    const timeoutIds: NodeJS.Timeout[] = [];
    let accumulatedTime = 0;

    story.forEach((message, index) => {
      accumulatedTime += message.timing.delay;

      const timeout = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, message]);
        void Haptics.selectionAsync();

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 30);

        if (index === story.length - 1) {
          setTimeout(() => {
            setIsComplete(true);
            onComplete();
          }, message.timing.duration + 800);
        }
      }, accumulatedTime);

      accumulatedTime += message.timing.duration;
      timeoutIds.push(timeout);
    });

    return () => {
      timeoutIds.forEach(clearTimeout);
      StatusBar.setBarStyle("default");
    };
  }, [story]);

  if (story.length === 0) return null;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingVertical: 24,
        paddingBottom: (insets.bottom + getToken("$6", "space")) as number,
      }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap="$2">
        {visibleMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </YStack>
    </ScrollView>
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
      title="Make them regret their life choices 😈"
      subtitle="Your friends won't know what hit them"
      footer={
        <OnboardingButton
          onPress={handleStart}
          text="Let's Start Some Drama! 🎯"
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
