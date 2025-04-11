import React, { useEffect, useMemo } from "react";
import type { ImageSourcePropType } from "react-native";
import { Modal, TextInput, TouchableOpacity } from "react-native";
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
import { FlashList } from "@shopify/flash-list";
import { Camera, CheckCircle2, ChevronRight } from "@tamagui/lucide-icons";
import { AsYouType } from "libphonenumber-js";
import { getToken, getTokens, useTheme } from "tamagui";

import { validators } from "@oppfy/validators";

import type { CountryData } from "~/data/groupedCountries";
import { countriesData, suggestedCountriesData } from "~/data/groupedCountries";
import useSearch from "~/hooks/useSearch";
import { Header } from "../Layouts";
import {
  Button,
  H6,
  Icon,
  Input,
  ListItem,
  ScreenView,
  SearchInput,
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
  subtitle?: string;
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
      <YStack gap="$6" paddingTop="$8">
        <AnimatedYStack
          gap="$2"
          entering={FadeIn.delay(200)}
          style={welcomeStyle}
        >
          {subtitle && (
            <AnimatedText
              color="rgba(255,255,255,0.7)"
              fontSize="$6"
              textAlign="center"
              fontWeight="600"
              entering={FadeIn.duration(1000)}
            >
              {subtitle}
            </AnimatedText>
          )}
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
  editable?: boolean;
  onPressIn?: () => void;
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
  editable = true,
  onPressIn,
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
        size="$7"
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
        editable={editable}
        onPressIn={onPressIn}
      />
    </Animated.View>
  );
}

// Button Component
interface OnboardingButtonProps {
  onPress: () => void;
  opacity?: number;
  backgroundColor?: string;
  disabled?: boolean;
  isLoading?: boolean;
  text?: string;
  isValid?: boolean;
  hideIcon?: boolean;
}

export function OnboardingButton({
  onPress,
  opacity = 1,
  backgroundColor = "white",
  disabled = false,
  isLoading = false,
  text = "Continue",
  isValid = true,
  hideIcon = false,
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
          backgroundColor={isValid ? backgroundColor : "rgba(255,255,255,0)"}
          borderRadius="$10"
          disabled={disabled || isLoading}
          opacity={opacity}
          pressStyle={{
            scale: 0.95,
            opacity: 0.9,
            backgroundColor: backgroundColor,
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
              {!hideIcon && (
                <ChevronRight
                  size={20}
                  color={isValid ? tokens.color.primary.val : "white"}
                />
              )}
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
  defaultImage: ImageSourcePropType | string | null;
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

// Phone Input Component
const countriesWithoutSections = countriesData.filter(
  (item): item is CountryData => typeof item !== "string",
);

interface OnboardingPhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  countryData: CountryData;
  onCountryChange: (countryData: CountryData) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function OnboardingPhoneInput({
  value,
  onChangeText,
  countryData,
  onCountryChange,
  placeholder = "Your number here",
  autoFocus = true,
}: OnboardingPhoneInputProps) {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [lastValidState, setLastValidState] = React.useState(false);
  const theme = useTheme();
  const inputScale = useSharedValue(1);
  const inputRef = React.useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch<CountryData>(
    {
      data: countriesWithoutSections,
      fuseOptions: {
        keys: ["name", "dialingCode", "countryCode"],
        threshold: 0.3,
      },
    },
  );

  const displayData = !searchQuery
    ? [...suggestedCountriesData, ...countriesData]
    : filteredItems;

  const formattedValue = useMemo(() => {
    if (!value) return "";
    const asYouType = new AsYouType(countryData.countryCode);
    return asYouType.input(value);
  }, [value, countryData.countryCode]);

  const isValidPhoneNumber = useMemo(
    () =>
      validators.phoneNumber.safeParse({
        phoneNumber: value,
        countryCode: countryData.countryCode,
      }).success,
    [value, countryData.countryCode],
  );

  useEffect(() => {
    if (isValidPhoneNumber && !lastValidState) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      inputScale.value = withSequence(
        withSpring(1.02, BUTTON_SPRING_CONFIG),
        withSpring(1, BUTTON_SPRING_CONFIG),
      );
    }
    setLastValidState(isValidPhoneNumber);
  }, [inputScale, isValidPhoneNumber, lastValidState]);

  const onCountrySelect = (selectedCountry: CountryData) => {
    onCountryChange(selectedCountry);
    setModalVisible(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    inputScale.value = withSequence(
      withSpring(1.02, BUTTON_SPRING_CONFIG),
      withSpring(1, BUTTON_SPRING_CONFIG),
    );
  };

  const handleTextChange = React.useCallback(
    (text: string) => {
      // Remove all non-numeric characters
      const numericValue = text.replace(/\D/g, "");

      if (numericValue !== value) {
        onChangeText(numericValue);

        if (numericValue.length === 0 && value.length > 0) {
          inputScale.value = withSpring(0.98, BUTTON_SPRING_CONFIG);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (numericValue.length > value.length) {
          inputScale.value = withSpring(1.02, BUTTON_SPRING_CONFIG);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          inputScale.value = withSpring(1, BUTTON_SPRING_CONFIG);
        }
      }
    },
    [value, onChangeText, inputScale],
  );

  const handlePress = React.useCallback(() => {
    inputRef.current?.focus();
    setFocused(true);
  }, []);

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  return (
    <>
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View flex={1} backgroundColor="$background">
          <Header
            title="Select Country"
            HeaderLeft={
              <Icon name="close" onPress={() => setModalVisible(false)} />
            }
          />
          <YStack
            flex={1}
            padding="$4"
            paddingBottom={0}
            gap={searchQuery ? "$4" : "$2"}
          >
            <SearchInput
              value={searchQuery}
              placeholder="Search countries"
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery("")}
            />

            <FlashList<CountryData | string>
              data={displayData}
              estimatedItemSize={43}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({
                item,
                index,
              }: {
                item: CountryData | string;
                index: number;
              }) => {
                if (typeof item === "string") {
                  return (
                    <View paddingVertical={8}>
                      <H6 theme="alt1">{item}</H6>
                    </View>
                  );
                }

                const isSelected = item.countryCode === countryData.countryCode;
                const isFirstInGroup =
                  index === 0 || typeof displayData[index - 1] === "string";
                const isLastInGroup =
                  index === displayData.length - 1 ||
                  typeof displayData[index + 1] === "string";
                const borderRadius = getToken("$6", "radius") as number;

                return (
                  <ListItem
                    size="$4.5"
                    padding={12}
                    borderBottomWidth={1}
                    backgroundColor="$gray2"
                    {...(isFirstInGroup && {
                      borderTopLeftRadius: borderRadius,
                      borderTopRightRadius: borderRadius,
                    })}
                    {...(isLastInGroup && {
                      borderBottomWidth: 0,
                      borderBottomLeftRadius: borderRadius,
                      borderBottomRightRadius: borderRadius,
                    })}
                    pressStyle={{
                      backgroundColor: "$gray3",
                    }}
                    onPress={() => onCountrySelect(item)}
                  >
                    <XStack
                      flex={1}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <XStack alignItems="center" gap="$2">
                        <Text fontSize="$8">{item.flag}</Text>
                        <Text fontSize="$5">{item.name}</Text>
                        <Text fontSize="$5" color="$gray9">
                          ({item.dialingCode})
                        </Text>
                      </XStack>

                      {isSelected && <CheckCircle2 />}
                    </XStack>
                  </ListItem>
                );
              }}
              getItemType={(item: CountryData | string) =>
                typeof item === "string" ? "sectionHeader" : "row"
              }
            />
          </YStack>
        </View>
      </Modal>

      <Animated.View style={inputStyle}>
        <AnimatedXStack
          backgroundColor="rgba(255,255,255,0.1)"
          borderRadius={16}
          shadowColor="#fff"
          shadowOpacity={0.1}
          shadowRadius={20}
          shadowOffset={{ width: 0, height: 10 }}
          entering={FadeIn.delay(400)}
          alignItems="center"
        >
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setModalVisible(true);
            }}
          >
            <XStack
              flex={1}
              minWidth={74}
              justifyContent="center"
              backgroundColor="rgba(255,255,255,0.1)"
              borderTopLeftRadius={16}
              borderBottomLeftRadius={16}
              paddingHorizontal="$4"
              alignItems="center"
              gap="$1.5"
            >
              <Text fontSize="$8" fontWeight="bold" color="#fff">
                {countryData.dialingCode}
              </Text>
            </XStack>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            onPress={handlePress}
            style={{ flex: 1 }}
          >
            <View height="$7">
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={handleTextChange}
                keyboardType="number-pad"
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  opacity: 0,
                }}
                autoComplete="off"
                autoFocus={autoFocus}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <AnimatedInput
                flex={1}
                value={formattedValue}
                editable={false}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                borderTopLeftRadius={0}
                borderBottomLeftRadius={0}
                borderWidth={0}
                size="$7"
                fontSize={24}
                color="#fff"
                textAlign="left"
                fontWeight="bold"
                padding={16}
                backgroundColor="transparent"
                selectionColor="white"
                pointerEvents="none"
              />
            </View>
          </TouchableOpacity>
        </AnimatedXStack>
      </Animated.View>
    </>
  );
}

// OTP Input Component
interface OnboardingOTPInputProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export function OnboardingOTPInput({
  value,
  onChange,
  autoFocus = true,
}: OnboardingOTPInputProps) {
  const inputRef = React.useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);
  const inputScale = useSharedValue(1);

  const handleTextChange = React.useCallback(
    (text: string) => {
      const newValue = text.replace(/[^0-9]/g, "").slice(0, 6);
      onChange(newValue);

      // Only animate when adding numbers, not when deleting
      if (text.length > value.length) {
        inputScale.value = withSequence(
          withSpring(1.02, BUTTON_SPRING_CONFIG),
          withSpring(1, BUTTON_SPRING_CONFIG),
        );

        if (text.length === 6) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } else {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else if (text.length < value.length) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [onChange, value.length],
  );

  const handlePress = React.useCallback(() => {
    inputRef.current?.focus();
    setFocused(true);
  }, []);

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  return (
    <Animated.View style={inputStyle}>
      <TouchableOpacity activeOpacity={1} onPress={handlePress}>
        <View>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleTextChange}
            keyboardType="number-pad"
            maxLength={6}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
            }}
            autoFocus={autoFocus}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <AnimatedXStack
            entering={FadeIn.delay(400)}
            width="100%"
            justifyContent="space-between"
            pointerEvents="none"
            gap="$2"
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <AnimatedYStack
                key={index}
                width={50}
                height={60}
                borderRadius={16}
                backgroundColor={
                  focused &&
                  (index === value.length ||
                    (value.length === 6 && index === 5))
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.1)"
                }
                justifyContent="center"
                alignItems="center"
                shadowColor="#fff"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 10 }}
                animation="quick"
              >
                <Text fontSize={24} fontWeight="bold" color="#fff">
                  {value[index] ?? ""}
                </Text>
              </AnimatedYStack>
            ))}
          </AnimatedXStack>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
