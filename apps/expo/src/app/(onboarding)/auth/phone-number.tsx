import React, { useMemo, useState } from "react";
import { Alert, Keyboard, Modal, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { FlashList } from "@shopify/flash-list";
import { CheckCircle2, ChevronLeft } from "@tamagui/lucide-icons";
import {
  getToken,
  H1,
  H6,
  ListItem,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import { Header } from "~/components/Headers";
import { SearchInput } from "~/components/Inputs";
import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import type { CountryData } from "~/data/groupedCountries";
import { countriesData, suggestedCountriesData } from "~/data/groupedCountries";
import {
  BoldText,
  DisclaimerText,
  InputWrapper,
  OnboardingButton,
  OnboardingInput,
} from "~/features/onboarding/components";
import useSearch from "~/hooks/useSearch";

const countriesWithoutSections = countriesData.filter(
  (item) => typeof item !== "string",
);

// ! This is for testing purposes only, do not use in production
auth().settings.appVerificationDisabledForTesting = true;

enum Error {
  INVALID_PHONE_NUMBER = "Invalid phone number. Please check the number and try again.",
  QUOTA_EXCEEDED = "SMS quota exceeded. Please try again later.",
  NETWORK_REQUEST_FAILED = "Network error. Please check your connection and try again.",
  TOO_MANY_REQUESTS = "Too many attempts. Please try again later.",
  UNKNOWN_ERROR = "An unknown error occurred. Please try again later.",
}

const FirebaseErrorCodes = {
  INVALID_PHONE_NUMBER: "auth/invalid-phone-number",
  QUOTA_EXCEEDED: "auth/quota-exceeded",
  NETWORK_REQUEST_FAILED: "auth/network-request-failed",
  TOO_MANY_REQUESTS: "auth/too-many-requests",
};

const isFirebaseError = (
  err: unknown,
): err is FirebaseAuthTypes.NativeFirebaseAuthError => {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as FirebaseAuthTypes.NativeFirebaseAuthError).code ===
      "string" &&
    (err as FirebaseAuthTypes.NativeFirebaseAuthError).code.startsWith("auth/")
  );
};

const PhoneNumber = () => {
  const router = useRouter();

  const { signInWithPhoneNumber } = useSession();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryData, setCountryData] = useState<CountryData>({
    name: "United States",
    countryCode: "US",
    dialingCode: "+1",
    flag: "🇺🇸",
  });

  const isValidPhoneNumber = useMemo(
    () =>
      sharedValidators.user.phoneNumber.safeParse({
        phoneNumber,
        countryCode: countryData.countryCode,
      }).success,
    [phoneNumber, countryData.countryCode],
  );

  const [error, setError] = useState<Error | null>(null);

  const onSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const e164PhoneNumber = `${countryData.dialingCode}${phoneNumber}`;

    try {
      await signInWithPhoneNumber(e164PhoneNumber);

      router.push({
        params: {
          phoneNumber: e164PhoneNumber,
        },
        pathname: "/auth/phone-number-otp",
      });
    } catch (err) {
      console.error("Error sending verification code:", err);

      if (!isFirebaseError(err)) {
        setError(Error.UNKNOWN_ERROR);
        return;
      }

      switch (err.code) {
        case FirebaseErrorCodes.INVALID_PHONE_NUMBER:
          setError(Error.INVALID_PHONE_NUMBER);
          break;
        case FirebaseErrorCodes.QUOTA_EXCEEDED:
          setError(Error.QUOTA_EXCEEDED);
          break;
        case FirebaseErrorCodes.NETWORK_REQUEST_FAILED:
          setError(Error.NETWORK_REQUEST_FAILED);
          break;
        case FirebaseErrorCodes.TOO_MANY_REQUESTS:
          setError(Error.TOO_MANY_REQUESTS);
          break;
        default:
          setError(Error.UNKNOWN_ERROR);
      }

      // Display error in an alert
      Alert.alert("Error", error || Error.UNKNOWN_ERROR);
    }
  };

  return (
    <KeyboardSafeView>
      <BaseScreenView
        safeAreaEdges={["bottom"]}
        backgroundColor="$background"
        paddingBottom={0}
        paddingHorizontal={0}
      >
        <YStack flex={1} justifyContent="space-between">
          <YStack paddingHorizontal="$4" gap="$6">
            <H1 textAlign="center">What's your{"\n"}phone number?</H1>

            <InputWrapper>
              <CountryPicker
                selectedCountryData={countryData}
                setSelectedCountryData={setCountryData}
              />
              <OnboardingInput
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError(null);
                }}
                placeholder="Your number here"
                keyboardType="phone-pad"
                autoFocus
                placeholderTextColor="$gray8"
                borderTopLeftRadius={0}
                borderBottomLeftRadius={0}
              />
            </InputWrapper>

            {error ? (
              <DisclaimerText color="$red9">{error}</DisclaimerText>
            ) : (
              <DisclaimerText>
                By Continuing you agree to our{" "}
                <BoldText>Privacy Policy</BoldText> and{" "}
                <BoldText>Terms of Service</BoldText>.
              </DisclaimerText>
            )}
          </YStack>

          <OnboardingButton onPress={onSubmit} disabled={!isValidPhoneNumber}>
            Send Verification Text
          </OnboardingButton>
        </YStack>
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

interface CountryPickerProps {
  selectedCountryData?: CountryData;
  setSelectedCountryData?: (countryData: CountryData) => void;
}

const CountryPicker = ({
  selectedCountryData,
  setSelectedCountryData,
}: CountryPickerProps) => {
  const theme = useTheme();

  const [modalVisible, setModalVisible] = useState(false);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch<CountryData>(
    {
      data: countriesWithoutSections,
      keys: ["name", "dialingCode", "countryCode"],
    },
  );

  const displayData = useMemo(() => {
    return !searchQuery
      ? [...suggestedCountriesData, ...countriesData]
      : filteredItems;
  }, [searchQuery, filteredItems]);

  const onCountrySelect = (countryData: CountryData) => {
    setSelectedCountryData && setSelectedCountryData(countryData);
    setModalVisible(false);
  };

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
              <TouchableOpacity
                hitSlop={10}
                onPress={() => setModalVisible(false)}
              >
                <ChevronLeft />
              </TouchableOpacity>
            }
          />
          <View flex={1} padding="$4" paddingBottom={0}>
            <YStack flex={1} gap="$2">
              <SearchInput
                value={searchQuery}
                placeholder="Search countries"
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery("")}
              />

              <CountriesFlashList
                data={displayData}
                onSelect={onCountrySelect}
                selectedCountryCode={selectedCountryData?.countryCode}
              />
            </YStack>
          </View>
        </View>
      </Modal>

      {/* Do not attempt to use Styled() to clean this up, it breaks the onPress event */}
      <TouchableOpacity
        style={{
          height: 76,
          borderRadius: getToken("$8", "radius") as number,
          backgroundColor: theme.gray4.val,
          paddingLeft: getToken("$3", "space") as number,
          paddingRight: getToken("$3", "space") as number,
          justifyContent: "center",
          shadowColor: theme.gray6.val,
          shadowOpacity: 0.1,
          shadowRadius: 10,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
      >
        <XStack alignItems="center" gap="$1.5">
          <Text fontSize="$9">{selectedCountryData?.flag}</Text>
          <Text fontSize="$6" fontWeight="bold">
            {selectedCountryData?.dialingCode}
          </Text>
        </XStack>
      </TouchableOpacity>
    </>
  );
};

interface CountriesFlastListProps {
  onSelect?: (countryData: CountryData) => void;
  selectedCountryCode?: string;
  data: (string | CountryData)[];
}

const CountriesFlashList = ({
  onSelect,
  selectedCountryCode,
  data,
}: CountriesFlastListProps) => {
  const insets = useSafeAreaInsets();

  return (
    <FlashList
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      data={data}
      onScrollBeginDrag={Keyboard.dismiss}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={43}
      renderItem={({ item, index }) => {
        if (typeof item === "string") {
          // Render header
          return (
            <View paddingVertical={8}>
              <H6 theme="alt1">{item}</H6>
            </View>
          );
        } else {
          const isSelected = item.countryCode === selectedCountryCode;

          const isFirstInGroup =
            index === 0 || typeof data[index - 1] === "string";

          const isLastInGroup =
            index === data.length - 1 || typeof data[index + 1] === "string";

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
              onPress={() => onSelect && onSelect(item)}
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
        }
      }}
      getItemType={(item) =>
        typeof item === "string" ? "sectionHeader" : "row"
      }
    />
  );
};

export default PhoneNumber;
