// import React, { useMemo, useRef, useState } from "react";
// import type { TextInput } from "react-native";
// import { KeyboardAvoidingView, Platform } from "react-native";
// import { useRouter } from "expo-router";
// import { Button, Input, Text, View, YStack } from "tamagui";
// import * as z from "zod";

// import { api } from "~/utils/api";

// const schemaValidation = z.object({
//   firstName: z.string().min(2),
// });

// const FirstName = () => {
//   const router = useRouter();

//   const [name, setName] = useState("");
//   const firstNameInputRef = useRef<TextInput | null>(null);

//   const updateName = api.user.updateName.useMutation();

//   const firstNameIsValid = useMemo(
//     () => schemaValidation.safeParse({ firstName: name }).success,
//     [name],
//   );

//   const onPress = async () => {
//     await updateName.mutateAsync({
//       name: name,
//     });

//     router.push("/user-info/date-of-birth");
//   };

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
//             What&apos;s your first name?
//           </Text>

//           <YStack space="$3">
//             <Input
//               ref={firstNameInputRef}
//               value={name}
//               onChangeText={setName}
//               onLayout={() => firstNameInputRef.current?.focus()}
//               textAlign="center"
//               backgroundColor="transparent"
//               height={50}
//               fontSize={36}
//               fontWeight="900"
//               fontFamily="$mono"
//               borderWidth={0}
//             />
//           </YStack>
//         </YStack>

//         <Button
//           onPress={onPress}
//           borderWidth={0}
//           pressStyle={{
//             backgroundColor: "$gray12",
//           }}
//           backgroundColor={firstNameIsValid ? "white" : "gray"}
//           disabled={!firstNameIsValid}
//         >
//           <Text
//             color={firstNameIsValid ? "black" : "lightgray"}
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

// export default FirstName;

import React, { useState } from "react";
import { useRouter } from "expo-router";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth from "@react-native-firebase/auth";
import { Button, Input, Text, View, XStack, YStack } from "tamagui";
import * as z from "zod";

import { KeyboardSafeView } from "~/components/SafeViews";
import { useSession } from "~/contexts/SessionsContext";
import useParams from "~/hooks/useParams";
import { api } from "~/utils/api";

const fullNameValidation = z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z]+([ '-][a-zA-Z]+)*$/),


const FullName = () => {
  const router = useRouter();

  const [fullName, setFullName] = useState("");

  const updateName = api.user.updateFullName.useMutation();

  const isValidFullName = fullNameValidation.safeParse(fullName).success;

  const onSubmit = async () => {
    await updateName.mutateAsync({
      name: fullName
    });

    router.push("/user-info/date-of-birth");
  };

  return (
    <KeyboardSafeView>
      <View flex={1} padding="$4" backgroundColor="$background">
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            What&apos;s your name?
          </Text>

          <XStack gap="$2">
            <Input
              flex={1}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
            />
          </XStack>
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isValidFullName}
          disabledStyle={{ opacity: 0.5 }}
        >
          Welcome
        </Button>
      </View>
    </KeyboardSafeView>
  );
};

// ! This is for testing purposes only, do not use in production
auth().settings.appVerificationDisabledForTesting = true;

export default FullName;
