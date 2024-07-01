import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Button, H1, Input, styled, Text, View, XStack, YStack } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import { api } from "~/utils/api";

const FullName = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const updateName = api.profile.updateFullName.useMutation();

  const isValidFullName =
    sharedValidators.user.fullName.safeParse(fullName).success;

  const onSubmit = async () => {
    await updateName.mutateAsync({
      fullName,
    });
    router.push("/user-info/date-of-birth");
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
          <YStack paddingHorizontal="$4" gap="$4">
            <H1 textAlign="center">What's your{"\n"}full name?</H1>

            <XStack elevation={5} shadowRadius={10} shadowOpacity={0.1}>
              <StyledInput
                value={fullName}
                onChangeText={setFullName}
                textAlign="center"
                placeholderTextColor="$gray8"
                autoFocus
              />
            </XStack>

            <Text color="$gray9" textAlign="center">
              By continuing, you agree to our{" "}
              <Text color="$color" fontWeight="bold">
                Privacy Policy
              </Text>{" "}
              and{" "}
              <Text color="$color" fontWeight="bold">
                Terms of Service
              </Text>
              .
            </Text>
          </YStack>

          <StyledButton onPress={onSubmit} disabled={!isValidFullName}>
            Continue
          </StyledButton>
        </YStack>
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

const StyledButton = styled(Button, {
  height: 60,
  borderWidth: 0,
  borderRadius: 0,
  backgroundColor: "$color",
  elevation: 5,
  shadowRadius: 10,
  shadowOpacity: 0.4,
  textProps: {
    color: "$color1",
    fontWeight: "bold",
    fontSize: 18,
  },
  pressStyle: {
    backgroundColor: "$color11",
  },
  disabledStyle: {
    backgroundColor: "$color9",
    opacity: 0.7,
  },
});

const StyledInput = styled(Input, {
  flex: 1,
  height: 70,
  borderRadius: "$9",
  backgroundColor: "$gray3",
  paddingLeft: "$3",
  paddingRight: "$3",
  selectionColor: "$color",
  borderWidth: 0,
  color: "$color",
  fontSize: "$8",
  shadowColor: "$gray6",
});

export default FullName;
