import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  SectionList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { AsYouType, CountryCode } from "libphonenumber-js";
import { Button, Separator, Text, useTheme, View, XStack } from "tamagui";

import { CountryData, groupedCountries } from "~/data/groupedCountries";

interface PhoneNumberInputProps {
  onCountrySelect: (code: string) => void;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  onCountrySelect,
}) => {
  const [show, setShow] = useState(false);
  const [countryCode, setCountryCode] = useState<CountryCode>("US");
  const [dialingCode, setDialingCode] = useState("1");
  const [number, setNumber] = useState("");
  const theme = useTheme();

  const formatPhoneNumber = (unformattedPhoneNumber: string) => {
    const phoneNumber = new AsYouType(countryCode).input(
      unformattedPhoneNumber,
    );
    console.log(phoneNumber);
    setNumber(phoneNumber);
  };

  const ModalContent = useCallback(() => {
    return (
      <SectionList
        sections={groupedCountries}
        keyExtractor={(item) => item.dialingCode + item.name}
        onEndReachedThreshold={0.8} // default is 0.1; increase to trigger earlier
        windowSize={60}
        maxToRenderPerBatch={60} // Increase as needed
        renderItem={({ item: countryData, index, section }) => (
          <View paddingHorizontal="$6">
            <TouchableOpacity
              onPress={() => handleCountrySelect(countryData)}
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
                <Text fontSize={18}>{countryData.flag}</Text>
                <Text fontSize={16} fontWeight="600">
                  {countryData.name}
                </Text>
                <Text fontSize={16} fontWeight="600" color="$gray11">
                  ({countryData.dialingCode})
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
  }, []);

  const handleCountrySelect = ({
    countryCode: newCountryCode,
    dialingCode,
  }: CountryData) => {
    if (countryCode !== newCountryCode) {
      formatPhoneNumber(number);
    }

    setDialingCode(dialingCode);
    setCountryCode(newCountryCode);
    setShow(false);
  };

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
