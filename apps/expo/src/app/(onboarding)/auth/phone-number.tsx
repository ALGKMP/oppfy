import React, { useMemo, useState } from "react";
import { Modal, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { CheckCircle2, ChevronLeft } from "@tamagui/lucide-icons";
import Fuse from "fuse.js";
import {
  Button,
  Input,
  ListItem,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { sharedValidators } from "@acme/validators";

import { Header } from "~/components/Headers";
import { KeyboardSafeView } from "~/components/Views";
import { BaseScreenView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import type { CountryData } from "~/data/groupedCountries";
import { countriesData, suggestedCountriesData } from "~/data/groupedCountries";

const countriesWithoutSections = countriesData.filter(
  (item) => typeof item !== "string",
) as CountryData[];

const fuse = new Fuse(countriesWithoutSections, {
  keys: ["name", "dialingCode"],
  threshold: 0.2,
});

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

  const isValidPhoneNumber = sharedValidators.user.phoneNumber.safeParse({
    phoneNumber,
    countryCode: countryData.countryCode,
  }).success;

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
      <BaseScreenView safeAreaEdges={["bottom"]}>
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            What&apos;s your phone number?
          </Text>

          <XStack gap="$2">
            <CountryPicker
              selectedCountryData={countryData}
              setSelectedCountryData={setCountryData}
            />
            <Input
              flex={1}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              keyboardType="phone-pad"
              autoFocus
            />
          </XStack>

          <Text color="$gray9">
            By continuing, you agree to our{" "}
            <Text color="$gray11" fontWeight="bold">
              Privacy Policy
            </Text>{" "}
            and{" "}
            <Text color="$gray11" fontWeight="bold">
              Terms of Service
            </Text>
            .
          </Text>
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isValidPhoneNumber}
          disabledStyle={{ opacity: 0.5 }}
        >
          Continue
        </Button>
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
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const onCountrySelect = (countryData: CountryData) => {
    setSelectedCountryData && setSelectedCountryData(countryData);
    setModalVisible(false);
  };

  const filteredCountries = useMemo(() => {
    return searchTerm
      ? fuse.search(searchTerm).map((result) => result.item)
      : [...suggestedCountriesData, ...countriesData];
  }, [searchTerm]);

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
          <View flex={1} paddingHorizontal="$4">
            <YStack flex={1} gap="$4">
              <Input
                placeholder="Search"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />

              <CountriesFlashList
                data={filteredCountries}
                onSelect={onCountrySelect}
                selectedCountryCode={selectedCountryData?.countryCode}
              />
            </YStack>
          </View>
        </View>
      </Modal>

      <Button onPress={() => setModalVisible(true)} paddingHorizontal="$2">
        {selectedCountryData && (
          <XStack alignItems="center" gap="$1">
            <Text fontSize="$8">{selectedCountryData.flag}</Text>
            <Text fontSize="$5" fontWeight="bold">
              {selectedCountryData.dialingCode}
            </Text>
          </XStack>
        )}
      </Button>
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

          // Render item
          return (
            <View>
              <ListItem
                size="$4.5"
                padding={12}
                borderColor="$gray4"
                borderWidth={1}
                borderBottomWidth={0}
                {...(isFirstInGroup && {
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                })}
                {...(isLastInGroup && {
                  borderBottomWidth: 1,
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,
                })}
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
            </View>
          );
        }
      }}
      getItemType={(item) => {
        // To achieve better performance, specify the type based on the item
        return typeof item === "string" ? "sectionHeader" : "row";
      }}
    />
  );
};

export default PhoneNumber;
