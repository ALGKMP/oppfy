import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { LayoutChangeEvent, TextInput } from "react-native";
import { Dimensions, Modal, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ChevronLeft } from "@tamagui/lucide-icons";
import parsePhoneNumberFromString, {
  AsYouType,
  getExampleNumber,
  isValidNumber,
} from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { Button, Input, Text, useTheme, View, XStack } from "tamagui";
import type {
  ButtonProps,
  InputProps,
  StackProps,
  TextProps,
  XStackProps,
} from "tamagui";

import { groupedCountries } from "~/data/groupedCountries";
import type { CountryData } from "~/data/groupedCountries";

const screenHeight = Dimensions.get("window").height;

interface PhoneNumberInputHandles {
  focus: () => void;
}

interface OnChangeParams {
  dialingCode: string;
  phoneNumber: string;
}

interface PhoneNumberInputProps {
  onChange?: ({ dialingCode, phoneNumber }: OnChangeParams) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  dialingCodeButtonStyle: ButtonProps;
  dialingCodeTextStyle?: TextProps;
  phoneNumberInputStyle?: InputProps;
  inputsContainerStyle?: XStackProps;
  modalContainerStyle?: StackProps;
}

const PhoneNumberInput = forwardRef<
  PhoneNumberInputHandles,
  PhoneNumberInputProps
>((props, ref) => {
  const [countryCode, setCountryCode] = useState<CountryCode>("US");
  const [dialingCode, setDialingCode] = useState("+1");

  const [rawInput, setRawInput] = useState("");

  const [isModalVisible, setIsModalVisible] = useState(false);

  const inputRef = useRef<TextInput | null>(null);

  // Expose focus method to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  const getExpectedLengthForCountry = (countryCode: CountryCode): number => {
    const exampleNumber = getExampleNumber(countryCode, examples);

    return exampleNumber
      ? exampleNumber.formatNational().replace(/\D+/g, "").length
      : Infinity;
  };

  const handleRawInputChange = (input: string): void => {
    setRawInput(input);

    const unformattedNumbers = input.replace(/\D+/g, "");
    const expectedLength = getExpectedLengthForCountry(countryCode);

    if (unformattedNumbers.length === expectedLength) {
      const formatted = new AsYouType(countryCode).input(unformattedNumbers);
      setRawInput(formatted);
    }

    props.onChange &&
      props.onChange({
        dialingCode,
        phoneNumber: unformattedNumbers,
      });
  };

  const handleCountrySelect = ({
    countryCode,
    dialingCode,
  }: CountryData): void => {
    setDialingCode(dialingCode);
    setCountryCode(countryCode);
    setIsModalVisible(false);

    const unformattedNumbers = rawInput.replace(/\D+/g, "");
    const expectedLength = getExpectedLengthForCountry(countryCode);

    let newInput = unformattedNumbers;

    if (unformattedNumbers.length === expectedLength) {
      newInput = new AsYouType(countryCode).input(unformattedNumbers);
    }

    setRawInput(newInput);

    if (props.onChange) {
      props.onChange({ dialingCode, phoneNumber: unformattedNumbers });
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <>
      <XStack {...props.inputsContainerStyle}>
        <Button
          onPress={() => {
            setIsModalVisible(true);
            inputRef.current?.blur();
          }}
          {...props.dialingCodeButtonStyle}
        >
          <XStack>
            <Text {...props.dialingCodeTextStyle}>{dialingCode}</Text>
          </XStack>
        </Button>

        <Input
          ref={inputRef}
          value={rawInput}
          onLayout={props.onLayout}
          onChangeText={handleRawInputChange}
          keyboardType="number-pad"
          {...props.phoneNumberInputStyle}
        />
      </XStack>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View {...props.modalContainerStyle}>
          <XStack
            padding="$6"
            alignItems="center"
            justifyContent="space-between"
          >
            <View width="$4">
              <ChevronLeft
                size="$1.5"
                onPress={() => setIsModalVisible(false)}
              />
            </View>
            <Text fontSize={16} fontWeight="600">
              Select Country
            </Text>
            <View width="$4" />
          </XStack>
          <CountriesFlashList onSelect={handleCountrySelect} />
        </View>
      </Modal>
    </>
  );
});

PhoneNumberInput.displayName = "PhoneNumberInput";

interface CountriesFlastListProps {
  onSelect: (countryData: CountryData) => void;
}

const CountriesFlashList = ({ onSelect }: CountriesFlastListProps) => {
  const theme = useTheme();

  return (
    <FlashList
      estimatedItemSize={48}
      estimatedFirstItemOffset={76}
      estimatedListSize={{
        height: screenHeight - 76,
        width: Dimensions.get("window").width,
      }}
      data={groupedCountries}
      renderItem={({ item, index }) => {
        const isFirstInGroup =
          index === 0 || typeof groupedCountries[index - 1] === "string";

        const isLastInGroup =
          index === groupedCountries.length - 1 ||
          typeof groupedCountries[index + 1] === "string";

        if (typeof item === "string") {
          // Rendering header
          return (
            <View paddingHorizontal="$6" marginVertical={8}>
              <Text fontSize={10} fontWeight="600">
                {item}
              </Text>
            </View>
          );
        } else {
          // Render item
          return (
            <View paddingHorizontal="$6">
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={{
                  padding: 12,
                  backgroundColor: theme.gray1.val,
                  ...(isLastInGroup && {
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                  }),
                  ...(isFirstInGroup && {
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                  }),
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

export default PhoneNumberInput;
