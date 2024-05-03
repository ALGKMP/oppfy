// import React, { useEffect, useMemo, useRef, useState } from "react";
// import type { TextInput } from "react-native";
// import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
// import { useRouter } from "expo-router";
// import { Button, Text, View, YStack } from "tamagui";
// import * as z from "zod";

// import { Date } from "@acme/utils";

// import { BirthdateInput } from "~/components/Inputs";
// import { api } from "~/utils/api";

// const schemaValidation = z.object({
//   dateOfBirth: z.string().refine(
//     (date) =>
//       date.length === 8 && // needed to short-circuit next check
//       new Date.AgeChecker(Date.convertToDateObject(date, "MMDDYYYY"))
//         .isAtLeast(13)
//         .isAtMost(100)
//         .checkValid(),
//   ),
// });

// const DateOfBirth = () => {
//   const router = useRouter();

//   const [dateOfBirth, setDateOfBirth] = useState("");
//   const dateOfBirthInputRef = useRef<TextInput | null>(null);

//   const updateDateOfBirth = api.user.updateDateOfBirth.useMutation();

//   const dataOfBirthIsValid = useMemo(
//     () => schemaValidation.safeParse({ dateOfBirth }).success,
//     [dateOfBirth],
//   );

//   const onPress = async () => {
//     await updateDateOfBirth.mutateAsync({
//       dateOfBirth: Date.convertToDateObject(dateOfBirth, "MMDDYYYY"),
//     });

//     router.push("/user-info/username");
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//       style={{ flex: 1 }}
//     >
//       <View
//         flex={1}
//         padding="$6"
//         backgroundColor="black"
//         justifyContent="space-between"
//       >
//         <YStack flex={1} space="$8" alignItems="center">
//           <Text
//             fontSize={22}
//             fontWeight="900"
//             alignSelf="center"
//             textAlign="center"
//           >
//             When's your birthday?
//           </Text>

//           <YStack space="$3">
//             <BirthdateInput
//               ref={dateOfBirthInputRef}
//               value={dateOfBirth}
//               onChange={(value) => setDateOfBirth(value)}
//               onLayout={() => dateOfBirthInputRef.current?.focus()}
//               containerStyle={{
//                 position: "relative",
//                 alignItems: "center",
//                 height: 50,
//               }}
//               inputStyle={{}}
//               charStyle={{
//                 fontFamily: "$chivoMono",
//                 textAlign: "center",
//                 fontSize: 36,
//                 fontWeight: "900",
//               }}
//               typedCharStyle={{}}
//               untypedCharStyle={{
//                 color: "$gray6",
//               }}
//               slashCharStyle={{
//                 color: "$gray6",
//               }}
//             />
//           </YStack>
//         </YStack>

//         <Button
//           onPress={onPress}
//           borderWidth={0}
//           pressStyle={{
//             backgroundColor: "$gray12",
//           }}
//           backgroundColor={dataOfBirthIsValid ? "white" : "gray"}
//           disabled={!dataOfBirthIsValid}
//         >
//           <Text
//             color={dataOfBirthIsValid ? "black" : "lightgray"}
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

// export default DateOfBirth;

// import React, { useState } from "react";
// import { Button } from "react-native";
// import DatePicker from 'react-native-date-picker';

// const DateOfBirth = () => {
//   // const [date, setDate] = useState(new Date());
//   // const [open, setOpen] = useState(false);

//   // return (
//   //   <>
//   //     <Button title="Open" onPress={() => setOpen(true)} />
//   //     <DatePicker
//   //       modal
//   //       mode="date"
//   //       open={open}
//   //       date={date}
//   //       onConfirm={(date) => {
//   //         setOpen(false);
//   //         setDate(date);
//   //       }}
//   //       onCancel={() => {
//   //         setOpen(false);
//   //       }}
//   //     />
//   //   </>
//   // );
// };

// export default DateOfBirth;

import React, { useState } from "react";
import { TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import DatePicker from "react-native-date-picker";
import { useRouter } from "expo-router";
import { Button, Input, Text, View, XStack, YStack } from "tamagui";

import { sharedValidators } from "@acme/validators";

import { KeyboardSafeView } from "~/components/SafeViews";
import { api } from "~/utils/api";

const DateOfBirth = () => {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [open, setOpen] = useState(false);

  const updateDateOfBirth = api.user.updateDateOfBirth.useMutation();

  const isValidDateOfBirth =
    sharedValidators.user.dateOfBirth.safeParse(dateOfBirth).success;

  const onSubmit = async () => {
    await updateDateOfBirth.mutateAsync({
      dateOfBirth,
    });

    router.push("/user-info/profile-picture");
  };

  return (
    <KeyboardSafeView>
      <View flex={1} padding="$4" backgroundColor="$background">
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            When&apos;s your birthday?
          </Text>

          <XStack gap="$2">
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setOpen(true)}
              disabled={false}
            >
              <View pointerEvents="none">
                <Input placeholder="Birthdate">
                  {dateOfBirth.toLocaleDateString()}
                </Input>
              </View>
            </TouchableOpacity>
          </XStack>

          <Text color="$gray9">You must be 13+ to use OPPFY.</Text>
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isValidDateOfBirth}
          disabledStyle={{ opacity: 0.5 }}
        >
          Continue
        </Button>
      </View>

      <DatePicker
        modal
        mode="date"
        open={open}
        date={dateOfBirth}
        onConfirm={(date) => {
          setOpen(false);
          setDateOfBirth(date);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </KeyboardSafeView>
  );
};

export default DateOfBirth;
