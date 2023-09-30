import React from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { H1, Text, View, YStack, Button} from "tamagui";
import useParams from "~/hooks/useParams";
import auth from "@react-native-firebase/auth";


interface SignUpFlowParams {
  email: string;
  marketing: boolean;
  [Key: string]: string | boolean;
}

const EmailInput = () => {

  const signUpFlowParams = useParams<SignUpFlowParams>();
  // const router = useRouter();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          flex={1}
          backgroundColor="$background"
          padding="$6"
          justifyContent="space-between"
        >
          <YStack space>
            <H1 fontFamily="$silkscreen" fontWeight="700" letterSpacing="$4" marginBottom={10}>
              Please Check Your Email :)
            </H1>
            <Text letterSpacing="$4">We have sent a link to {signUpFlowParams.email} to help you log back into your account</Text>
          </YStack>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default EmailInput;
