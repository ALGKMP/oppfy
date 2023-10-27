import React, { useEffect, useState } from "react";
import { Modal, SectionList, TextInput, TouchableOpacity } from "react-native";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { AsYouType, getExampleNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { Button, Separator, Text, useTheme, View, XStack } from "tamagui";

import { groupedCountries } from "~/data/groupedCountries";
import type { CountryData } from "~/data/groupedCountries";

interface PhoneNumberInputProps {
  onChange: (number: string, countryCode: string) => void;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ onChange }) => {
  const theme = useTheme();
  const [show, setShow] = useState(false);
  const [countryCode, setCountryCode] = useState<CountryCode>("US");
  const [dialingCode, setDialingCode] = useState("1");

  const [rawInput, setRawInput] = useState("");

  const getExpectedLengthForCountry = (countryCode: CountryCode) => {
    const exampleNumber = getExampleNumber(countryCode, examples);
    if (exampleNumber) {
      return exampleNumber.formatNational().replace(/\D+/g, "").length;
    }
    return 10; // default value in case the library doesn't provide an example
  };

  const handleRawInputChange = (input: string) => {
    setRawInput(input);

    const unformattedNumbers = input.replace(/\D+/g, "");
    const expectedLength = getExpectedLengthForCountry(countryCode);

    if (unformattedNumbers.length === expectedLength) {
      const formatted = new AsYouType(countryCode).input(unformattedNumbers);
      setRawInput(formatted);
    }

    onChange(unformattedNumbers, countryCode);
  };

  const handleCountrySelect = ({ countryCode, dialingCode }: CountryData) => {
    setDialingCode(dialingCode);
    setCountryCode(countryCode);
    setShow(false);

    const unformattedNumbers = rawInput.replace(/\D+/g, "");
    const expectedLength = getExpectedLengthForCountry(countryCode);

    let newInput = unformattedNumbers;

    if (unformattedNumbers.length === expectedLength) {
      newInput = new AsYouType(countryCode).input(unformattedNumbers);
    }

    setRawInput(newInput);
    onChange(newInput, countryCode);
  };

  const ModalContent = () => (
    <SectionList
      sections={groupedCountries}
      keyExtractor={(item) => item.dialingCode + item.name}
      renderItem={({ item, index, section }) => (
        <View paddingHorizontal="$6">
          <TouchableOpacity
            onPress={() => handleCountrySelect(item)}
            style={{
              padding: 12,
              backgroundColor: theme.gray1.val,
              borderTopLeftRadius: index === 0 ? 10 : 0,
              borderTopRightRadius: index === 0 ? 10 : 0,
              borderBottomLeftRadius:
                index === section.data.length - 1 ? 10 : 0,
              borderBottomRightRadius:
                index === section.data.length - 1 ? 10 : 0,
            }}
          >
            <XStack space={8} alignItems="center">
              <Text fontSize={18}>{item.flag}</Text>
              <Text fontSize={16} fontWeight="600">
                {item.name}
              </Text>
              <Text fontSize={16} fontWeight="600" color="$gray11">
                ({item.dialingCode})
              </Text>
            </XStack>
          </TouchableOpacity>
          {index !== section.data.length - 1 && <Separator />}
        </View>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <View paddingHorizontal="$6" marginVertical={8}>
          <Text fontSize={10} fontWeight="600">
            {title}
          </Text>
        </View>
      )}
    />
  );

  return (
    <>
      <Button onPress={() => setShow(true)}>{dialingCode}</Button>

      <TextInput
        value={rawInput}
        onChangeText={handleRawInputChange}
        placeholder="Enter phone number"
        keyboardType="number-pad"
        style={{
          padding: 12,
          fontSize: 16,
          color: "white",
          borderColor: "gray",
          borderWidth: 1,
          borderRadius: 8,
        }}
      />

      <Modal visible={show} animationType="slide">
        <View backgroundColor="$backgroundStrong" flex={1}>
          <XStack
            padding="$6"
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="black"
          >
            <View width="$4">
              <ChevronLeft size="$1.5" onPress={() => setShow(false)} />
            </View>
            <Text fontSize={16} fontWeight="600">
              Select Country
            </Text>
            <View width="$4" />
          </XStack>
          <ModalContent />
        </View>
      </Modal>
    </>
  );
};

export default PhoneNumberInput;
