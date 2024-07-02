import React, { useMemo, useState } from "react";
import { Keyboard, Modal, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { CheckCircle2, ChevronLeft } from "@tamagui/lucide-icons";
import {
  Button,
  getToken,
  H1,
  Input,
  ListItem,
  SizableText,
  styled,
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
) as CountryData[];

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

  const onSubmit = async () => {
    const e164PhoneNumber = `${countryData.dialingCode}${phoneNumber}`;

    await signInWithPhoneNumber(e164PhoneNumber);

    router.push({
      params: {
        phoneNumber: e164PhoneNumber,
      },
      pathname: "/auth/phone-number-otp",
    });
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
                onChangeText={setPhoneNumber}
                placeholder="Your number here"
                keyboardType="phone-pad"
                autoFocus
                placeholderTextColor="$gray8"
                borderTopLeftRadius={0}
                borderBottomLeftRadius={0}
              />
            </InputWrapper>

            <DisclaimerText>
              By Continuing you agree to our <BoldText>Privacy Policy</BoldText>{" "}
              and <BoldText>Terms of Service</BoldText>.
            </DisclaimerText>
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

  const insets = useSafeAreaInsets();
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
        <View
          flex={1}
          backgroundColor="$background"
          paddingTop={insets.top}
          paddingLeft={insets.left}
          paddingRight={insets.right}
        >
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
            <YStack flex={1} gap="$4">
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
          borderRadius: getToken("$10", "radius") as number,
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
        onPress={() => setModalVisible(true)}
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
  return (
    <FlashList
      data={data}
      onScrollBeginDrag={Keyboard.dismiss}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={43}
      renderItem={({ item, index }) => {
        if (typeof item === "string") {
          // Render header
          return (
            <View marginVertical={8}>
              <SizableText size="$1" theme="alt1">
                {item}
              </SizableText>
            </View>
          );
        } else {
          const isSelected = item.countryCode === selectedCountryCode;

          const isFirstInGroup =
            index === 0 || typeof data[index - 1] === "string";

          const isLastInGroup =
            index === data.length - 1 || typeof data[index + 1] === "string";

          return (
            <ListItem
              size="$4.5"
              padding={12}
              borderBottomWidth={1}
              backgroundColor="$gray2"
              {...(isFirstInGroup && {
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
              })}
              {...(isLastInGroup && {
                borderBottomWidth: 0,
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
              })}
              pressStyle={{
                backgroundColor: "$gray3",
              }}
              onPress={() => onSelect && onSelect(item)}
            >
              <XStack flex={1} justifyContent="space-between">
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
