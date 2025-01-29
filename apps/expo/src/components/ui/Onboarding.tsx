import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Camera, ChevronRight } from "@tamagui/lucide-icons";
import { getTokens } from "tamagui";

import {
  Button,
  Input,
  ScreenView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "./";

// Animated Components
const AnimatedYStack = Animated.createAnimatedComponent(YStack);
const AnimatedXStack = Animated.createAnimatedComponent(XStack);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedInput = Animated.createAnimatedComponent(Input);
const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedView = Animated.createAnimatedComponent(View);

// Shared Animation Configs
const SPRING_CONFIG = {
  mass: 1,
  damping: 15,
  stiffness: 100,
};

const BUTTON_SPRING_CONFIG = {
  mass: 0.5,
  damping: 10,
};

// Base Screen Component
interface OnboardingScreenProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  error?: string | null;
  successMessage?: string;
  footer?: React.ReactNode;
}

export function OnboardingScreen({
  title,
  subtitle,
  children,
  error,
  successMessage,
  footer,
}: OnboardingScreenProps) {
  const welcomeFloat = useSharedValue(0);

  useEffect(() => {
    welcomeFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 }),
      ),
      -1,
      true,
    );
  }, []);

  const welcomeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(welcomeFloat.value, [0, 1], [0, -8]) },
    ],
  }));

  return (
    <ScreenView
      keyboardAvoiding
      safeAreaEdges={["bottom"]}
      paddingHorizontal="$6"
      justifyContent="space-between"
    >
      <YStack gap="$6" paddingTop="$12">
        <AnimatedYStack
          gap="$2"
          entering={FadeIn.delay(200)}
          style={welcomeStyle}
        >
          <AnimatedText
            color="rgba(255,255,255,0.7)"
            fontSize="$6"
            textAlign="center"
            fontWeight="600"
            entering={FadeIn.duration(1000)}
          >
            {subtitle}
          </AnimatedText>
          <Text
            color="white"
            fontSize="$9"
            lineHeight={40}
            textAlign="center"
            fontWeight="800"
          >
            {title}
          </Text>
        </AnimatedYStack>

        <YStack gap="$4">
          {children}

          {error && (
            <Text color="$red11" textAlign="center" fontSize="$5">
              {error}
            </Text>
          )}
          {!error && successMessage && (
            <AnimatedText
              textAlign="center"
              fontSize="$5"
              entering={FadeIn.duration(800).delay(200)}
            >
              {successMessage}
            </AnimatedText>
          )}
        </YStack>
      </YStack>

      {footer}
    </ScreenView>
  );
}

// Input Component
interface OnboardingInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholders?: string[];
  autoFocus?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  keyboardType?:
    | "default"
    | "number-pad"
    | "decimal-pad"
    | "numeric"
    | "email-address"
    | "phone-pad";
  secureTextEntry?: boolean;
}

export function OnboardingInput({
  value,
  onChangeText,
  placeholder,
  placeholders = [],
  autoFocus = false,
  autoCapitalize = "none",
  autoCorrect = false,
  keyboardType = "default",
  secureTextEntry = false,
}: OnboardingInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = React.useState(
    placeholder ?? placeholders[0] ?? "",
  );
  const inputScale = useSharedValue(1);

  useEffect(() => {
    if (placeholders.length === 0) return;

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setCurrentPlaceholder(placeholders[index]!);
    }, 3000);

    return () => clearInterval(interval);
  }, [placeholders]);

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  const handleTextChange = (text: string) => {
    onChangeText(text);

    if (text.length === 0 && value.length > 0) {
      inputScale.value = withSpring(0.98, BUTTON_SPRING_CONFIG);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (text.length === 1 && value.length === 0) {
      inputScale.value = withSpring(1.02, BUTTON_SPRING_CONFIG);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      inputScale.value = withSpring(1, BUTTON_SPRING_CONFIG);
    }
  };

  return (
    <Animated.View style={inputStyle}>
      <AnimatedInput
        value={value}
        onChangeText={handleTextChange}
        entering={FadeIn.delay(400)}
        placeholder={currentPlaceholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        borderWidth={0}
        size="$6"
        fontSize={24}
        color="#fff"
        textAlign="center"
        fontWeight="bold"
        padding={16}
        backgroundColor="rgba(255,255,255,0.1)"
        borderRadius={16}
        shadowColor="#fff"
        shadowOpacity={0.1}
        shadowRadius={20}
        shadowOffset={{ width: 0, height: 10 }}
        selectionColor="white"
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </Animated.View>
  );
}

// Button Component
interface OnboardingButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  text?: string;
  isValid?: boolean;
}

export function OnboardingButton({
  onPress,
  disabled = false,
  isLoading = false,
  text = "Continue",
  isValid = false,
}: OnboardingButtonProps) {
  const tokens = getTokens();
  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePress = () => {
    buttonScale.value = withSequence(
      withSpring(0.95, BUTTON_SPRING_CONFIG),
      withSpring(1.05, BUTTON_SPRING_CONFIG),
      withSpring(1, BUTTON_SPRING_CONFIG),
    );
    onPress();
  };

  return (
    <Animated.View style={buttonStyle}>
      <AnimatedXStack entering={FadeIn.delay(600)}>
        <Button
          flex={1}
          backgroundColor={isValid ? "white" : "rgba(255,255,255,0)"}
          borderRadius="$10"
          disabled={disabled || isLoading}
          pressStyle={{
            scale: 0.95,
            opacity: 0.9,
            backgroundColor: "white",
          }}
          animation="medium"
          onPress={handlePress}
        >
          {isLoading ? (
            <Spinner />
          ) : (
            <XStack gap="$2" alignItems="center" justifyContent="center">
              <Text
                color={isValid ? tokens.color.primary.val : "white"}
                fontSize="$6"
                fontWeight="600"
              >
                {text}
              </Text>
              <ChevronRight
                size={20}
                color={isValid ? tokens.color.primary.val : "white"}
              />
            </XStack>
          )}
        </Button>
      </AnimatedXStack>
    </Animated.View>
  );
}

// Profile Picture Component
interface OnboardingProfilePictureProps {
  imageUri?: string | null;
  defaultImage: any;
  onPress: () => void;
  onImageLoad?: () => void;
}

export function OnboardingProfilePicture({
  imageUri,
  defaultImage,
  onPress,
  onImageLoad,
}: OnboardingProfilePictureProps) {
  const tokens = getTokens();
  const imageScale = useSharedValue(1);

  useEffect(() => {
    imageScale.value = withTiming(0, { duration: 0 });
    setTimeout(() => {
      imageScale.value = withSpring(1, SPRING_CONFIG);
    }, 400);
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
    opacity: withSpring(imageScale.value),
  }));

  const handlePress = () => {
    imageScale.value = withSpring(0.95, BUTTON_SPRING_CONFIG);
    onPress();
  };

  const handleLoad = () => {
    imageScale.value = withSequence(
      withSpring(1.1, BUTTON_SPRING_CONFIG),
      withSpring(1, BUTTON_SPRING_CONFIG),
    );
    onImageLoad?.();
  };

  return (
    <TouchableOpacity
      style={{ width: "100%" }}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <Animated.View style={imageStyle}>
        <AnimatedView
          position="relative"
          alignItems="center"
          entering={FadeIn.delay(400)}
        >
          <View>
            <AnimatedImage
              source={imageUri ?? defaultImage}
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                borderColor: "white",
                borderWidth: 3,
                shadowColor: "white",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
              }}
              contentFit="cover"
              onLoad={handleLoad}
            />
            <View
              position="absolute"
              right={-4}
              bottom={-4}
              backgroundColor="white"
              backdropFilter="blur(12px)"
              borderRadius={32}
              padding="$3"
              borderWidth={2}
              borderColor={tokens.color.primary.val}
            >
              <Camera size={24} color={tokens.color.primary.val} />
            </View>
          </View>
        </AnimatedView>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Date Picker Component
interface OnboardingDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  placeholders?: string[];
  autoFocus?: boolean;
}

export function OnboardingDatePicker({
  value,
  onChange,
  placeholder,
  placeholders = [],
  autoFocus = false,
}: OnboardingDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const inputScale = useSharedValue(1);

  const handlePress = () => {
    inputScale.value = withSpring(0.98, BUTTON_SPRING_CONFIG);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(true);
  };

  const handleConfirm = (date: Date) => {
    setIsOpen(false);
    onChange(date);
    inputScale.value = withSequence(
      withSpring(1.02, BUTTON_SPRING_CONFIG),
      withSpring(1, BUTTON_SPRING_CONFIG),
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <OnboardingInput
      value={value?.toLocaleDateString() ?? ""}
      onChangeText={() => {}}
      placeholder={placeholder}
      placeholders={placeholders}
      autoFocus={autoFocus}
      onPressIn={handlePress}
      editable={false}
    />
  );
}
