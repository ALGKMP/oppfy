import React, { useMemo, useState } from "react";
import { Keyboard, Modal, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { CheckCircle2, ChevronLeft } from "@tamagui/lucide-icons";
import { useTheme } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import { Header } from "~/components/Layouts";
import {
  H2,
  H6,
  ListItem,
  OnboardingButton,
  OnboardingInput,
  Paragraph,
  ScreenView,
  SearchInput,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";
import type { CountryData } from "~/data/groupedCountries";
import { countriesData, suggestedCountriesData } from "~/data/groupedCountries";
import useSearch from "~/hooks/useSearch";

const countriesWithoutSections = countriesData.filter(
  (item) => typeof item !== "string",
);

enum Error {
  INVALID_PHONE_NUMBER = "Invalid phone number. Please check the number and try again.",
  QUOTA_EXCEEDED = "SMS quota exceeded. Please try again later.",
  NETWORK_REQUEST_FAILED = "Network error. Please check your connection and try again.",
  TOO_MANY_REQUESTS = "Too many attempts. Please try again later.",
  UNKNOWN_ERROR = "An unknown error occurred. Please try again later.",
}

const PhoneNumber = () => {
  const router = useRouter();
  const { sendVerificationCode } = useSession();

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
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);
    setError(null);

    const e164PhoneNumber = `${countryData.dialingCode}${phoneNumber}`;

    try {
      const success = await sendVerificationCode(e164PhoneNumber);

      if (success) {
        router.push({
          params: {
            phoneNumber: e164PhoneNumber,
          },
          pathname: "/firebaseauth/phone-number-otp",
        });
      }
    } catch (err: unknown) {
      console.error("Error sending verification code:", err);
      if (err && typeof err === "object" && "message" in err) {
        const errorMessage = (err as { message: string }).message;
        switch (errorMessage) {
          case "QUOTA_EXCEEDED":
            setError(Error.QUOTA_EXCEEDED);
            break;
          case "NETWORK_REQUEST_FAILED":
            setError(Error.NETWORK_REQUEST_FAILED);
            break;
          case "TOO_MANY_REQUESTS":
            setError(Error.TOO_MANY_REQUESTS);
            break;
          default:
            setError(Error.UNKNOWN_ERROR);
        }
      } else {
        setError(Error.UNKNOWN_ERROR);
      }
    }

    setIsLoading(false);
  };

  return (
    <ScreenView
      paddingBottom={0}
      paddingTop="$10"
      justifyContent="space-between"
      keyboardAvoiding
      safeAreaEdges={["bottom"]}
    >
      <YStack alignItems="center" gap="$6">
        <H2 textAlign="center">What's your{"\n"}phone number?</H2>

        <XStack>
          <CountryPicker
            selectedCountryData={countryData}
            setSelectedCountryData={setCountryData}
          />
          <OnboardingInput
            flex={1}
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
        </XStack>

        {error ? (
          <Paragraph size="$5" color="$red9" textAlign="center">
            {error}
          </Paragraph>
        ) : (
          <Paragraph size="$5" color="$gray11" textAlign="center">
            By Continuing you agree to our{" "}
            <Text fontWeight="bold">Privacy Policy</Text> and{" "}
            <Text fontWeight="bold">Terms of Service</Text>.
          </Paragraph>
        )}
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onSubmit}
        disabled={!isValidPhoneNumber || isLoading}
      >
        {isLoading ? <Spinner /> : "Send Verification Text"}
      </OnboardingButton>
    </ScreenView>
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
  const [modalVisible, setModalVisible] = useState(false);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch<CountryData>(
    {
      data: countriesWithoutSections,
      fuseOptions: {
        keys: ["name", "dialingCode", "countryCode"],
        threshold: 0.3,
      },
    },
  );

  const displayData = useMemo(() => {
    return !searchQuery
      ? [...suggestedCountriesData, ...countriesData]
      : filteredItems;
  }, [searchQuery, filteredItems]);

  const onCountrySelect = (countryData: CountryData) => {
    setSelectedCountryData?.(countryData);
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

            <CountriesFlashList
              data={displayData}
              onSelect={onCountrySelect}
              selectedCountryCode={selectedCountryData?.countryCode}
            />
          </YStack>
        </View>
      </Modal>

      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
          setModalVisible(true);
        }}
      >
        <XStack
          height={76}
          borderRadius="$6"
          backgroundColor="$gray4"
          paddingHorizontal="$3"
          alignItems="center"
          gap="$2"
          borderTopRightRadius={0}
          borderBottomRightRadius={0}
        >
          <Text fontSize={24}>{selectedCountryData?.flag}</Text>
          <Text fontSize={16} fontWeight="500">
            {selectedCountryData?.dialingCode}
          </Text>
        </XStack>
      </TouchableOpacity>
    </>
  );
};

interface CountriesFlashListProps {
  onSelect?: (countryData: CountryData) => void;
  selectedCountryCode?: string;
  data: (string | CountryData)[];
}

const CountriesFlashList = ({
  onSelect,
  selectedCountryCode,
  data,
}: CountriesFlashListProps) => {
  const insets = useSafeAreaInsets();

  return (
    <FlashList
      data={data}
      estimatedItemSize={56}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      renderItem={({ item }) => {
        if (typeof item === "string") {
          return (
            <H6 color="$gray11" marginTop="$4" marginBottom="$2">
              {item}
            </H6>
          );
        }

        const isSelected = item.countryCode === selectedCountryCode;

        return (
          <ListItem
            title={`${item.flag}  ${item.name}`}
            subTitle={item.dialingCode}
            onPress={() => onSelect?.(item)}
            pressStyle={{
              backgroundColor: "$gray4",
            }}
            iconAfter={isSelected ? <CheckCircle2 color="$blue9" /> : undefined}
          />
        );
      }}
    />
  );
};

export default PhoneNumber;
