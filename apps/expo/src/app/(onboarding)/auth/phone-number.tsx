import React, { useMemo, useState } from "react";
import { Modal, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { CheckCircle2, ChevronLeft } from "@tamagui/lucide-icons";
import Fuse from "fuse.js";
import { isValidPhoneNumber as validatePhoneNumber } from "libphonenumber-js";
import { Button, Input, Text, useTheme, View, XStack, YStack } from "tamagui";

import { Header } from "~/components/Headers";
import { KeyboardSafeView } from "~/components/SafeViews";
import { useSession } from "~/contexts/SessionsContext";
import type { CountryData } from "~/data/groupedCountries";
import { countriesData, suggestedCountriesData } from "~/data/groupedCountries";
import type { SignUpFlowParams } from "./pin-code-otp";

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

  const isValidPhoneNumber = useMemo(
    () => validatePhoneNumber(phoneNumber, countryData.countryCode),
    [phoneNumber, countryData.countryCode],
  );

  const onSubmit = async () => {
    const e164PhoneNumber = `${countryData.dialingCode}${phoneNumber}`;

    await signInWithPhoneNumber(e164PhoneNumber);

    router.push({
      params: {
        phoneNumber: e164PhoneNumber,
      } satisfies SignUpFlowParams,
      pathname: "/auth/pin-code-otp",
    });
  };

  return (
    <KeyboardSafeView>
      <View flex={1} padding="$4" backgroundColor="$background">
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
          Welcome
        </Button>
      </View>
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
          <View flex={1} paddingHorizontal="$4" backgroundColor="$background">
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
  const theme = useTheme();

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
              <Text fontSize={10} fontWeight="600">
                {item}
              </Text>
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
              <TouchableOpacity
                onPress={() => onSelect && onSelect(item)}
                style={{
                  padding: 12,
                  borderColor: theme.gray4.val,
                  borderWidth: 1,
                  borderBottomWidth: 0,
                  backgroundColor: theme.gray2.val,
                  ...(isFirstInGroup && {
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                  }),
                  ...(isLastInGroup && {
                    borderBottomWidth: 1,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                  }),
                }}
              >
                <XStack justifyContent="space-between">
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize="$8">{item.flag}</Text>
                    <Text fontSize="$5">{item.name}</Text>
                    <Text fontSize="$5" color="$gray9">
                      ({item.dialingCode})
                    </Text>
                  </XStack>

                  {isSelected && <CheckCircle2 />}
                </XStack>
              </TouchableOpacity>
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

// const PhoneNumber = () => {
//   const router = useRouter();

//   const [phoneNumber, setPhoneNumber] = useState("");
//   const phoneNumberInputRef = useRef<TextInput | null>(null);

//   const phoneNumberIsValid = useMemo(
//     () => schemaValidation.safeParse({ phoneNumber }).success,
//     [phoneNumber],
//   );

//   const onPress = () =>
//     router.push({
//       params: { phoneNumber } satisfies SignUpFlowParams,
//       pathname: "/auth/pin-code-otp",
//     });

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//       style={{ flex: 1 }}
//     >
//       <View
//         flex={1}
//         backgroundColor="black"
//         padding="$6"
//         justifyContent="space-between"
//       >
//         <YStack flex={1} space="$8" alignItems="center">
//           <Text
//             alignSelf="center"
//             textAlign="center"
//             fontSize={22}
//             fontWeight="900"
//           >
//             What&apos;s your phone number?
//           </Text>

//           <YStack space="$3">
//             <PhoneNumberInput
//               ref={phoneNumberInputRef}
//               onLayout={() => phoneNumberInputRef.current?.focus()}
//               onChange={({ dialingCode, phoneNumber }) =>
//                 setPhoneNumber(dialingCode + phoneNumber)
//               }
//               modalContainerStyle={{
//                 flex: 1,
//                 backgroundColor: "$backgroundStrong",
//               }}
//               inputsContainerStyle={{
//                 width: "100%",
//                 alignItems: "center",
//               }}
//               dialingCodeButtonStyle={{
//                 backgroundColor: "transparent",
//                 borderColor: "$gray7",
//                 borderWidth: 2,
//                 borderRadius: 12,
//                 height: 50,
//                 width: 70,
//               }}
//               dialingCodeTextStyle={{
//                 fontSize: 22,
//               }}
//               phoneNumberInputStyle={{
//                 flex: 1,
//                 borderWidth: 0,
//                 fontSize: 32,
//                 fontFamily: "$mono",
//                 fontWeight: "900",
//                 backgroundColor: "transparent",
//               }}
//             />
//           </YStack>

//           <Text
//             textAlign="center"
//             fontSize={14}
//             fontWeight="700"
//             color="$gray11"
//           >
//             {[
//               "By continuing, you agree to our ",
//               <Link key="privacy-policy" href="https://fill">
//                 <Text color="$gray10">Privacy Policy</Text>
//               </Link>,
//               " and ",
//               <Link key="terms-of-service" href="https://fill">
//                 <Text color="$gray10">Terms of Service.</Text>
//               </Link>,
//             ]}
//           </Text>
//         </YStack>

//         <Button
//           onPress={onPress}
//           borderWidth={0}
//           pressStyle={{
//             backgroundColor: "$gray12",
//           }}
//           backgroundColor={phoneNumberIsValid ? "white" : "gray"}
//           disabled={!phoneNumberIsValid}
//         >
//           <Text
//             color={phoneNumberIsValid ? "black" : "lightgray"}
//             fontWeight="600"
//             fontSize={16}
//           >
//             Next
//           </Text>
//         </Button>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

export default PhoneNumber;
