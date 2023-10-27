import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, SectionList, TextInput, TouchableOpacity } from "react-native";
import { ChevronLeft } from "@tamagui/lucide-icons";
import {
  AsYouType,
  CountryCode,
  format,
  formatNumber,
} from "libphonenumber-js";
import { Button, Separator, Text, useTheme, View, XStack } from "tamagui";

import { CountryData, groupedCountries } from "~/data/groupedCountries";

interface PhoneNumberInputProps {
  onNumberChange?: (e164Formatted: string) => void;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  onNumberChange,
}) => {
  const theme = useTheme();
  const [show, setShow] = useState(false);
  const [number, setNumber] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("US");
  const [dialingCode, setDialingCode] = useState("1");
  const [rawInput, setRawInput] = useState(""); // <- New state to keep track of raw user input

  const formatPhoneNumber = (inputNumber: string) => {
    const formatted = new AsYouType(countryCode).input(inputNumber);
    setNumber(formatted); // Set the formatted display number

    const e164Formatted = formatNumber(formatted, countryCode, "E.164");
    if (onNumberChange) {
      onNumberChange(e164Formatted);
    }
  };

  const handleCountrySelect = (selectedCountry: CountryData) => {
    setDialingCode(selectedCountry.dialingCode);
    setCountryCode(selectedCountry.countryCode);
    setShow(false);
    formatPhoneNumber(number.replace(`+${dialingCode}`, ""));
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
        value={number}
        placeholder="Enter phone number"
        keyboardType="number-pad"
        onChangeText={formatPhoneNumber}
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
