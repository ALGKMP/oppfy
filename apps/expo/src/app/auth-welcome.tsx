import React from "react";
import { useRouter } from "expo-router";
import Tinder from "@assets/tinder.png";
import { Button, Image, Text, View, YStack } from "tamagui";

const AuthWelcome = () => {
  const router = useRouter();

  return (
    <View flex={1} backgroundColor={"$background"}>
      <View
        flex={1}
        alignItems="center"
        justifyContent="center"
        marginBottom="$4"
      >
        <Image source={Tinder} resizeMode="contain" />
      </View>

      <YStack marginHorizontal="$4" padding="$2" space={"$4"}>
        <Text padding={"$2"} textAlign="center" fontSize={12}>
          By tapping &apos;Sign in&apos;, you agree with our{" "}
          <Text fontWeight={"500"} textDecorationLine="underline">
            Terms.
          </Text>{" "}
          Learn how we process your data in our{" "}
          <Text fontWeight={"500"} textDecorationLine="underline">
            Privacy Policy
          </Text>{" "}
          and{" "}
          <Text fontWeight={"500"} textDecorationLine="underline">
            Cookies Policy
          </Text>
          .
        </Text>

        <Button
          backgroundColor={"white"}
          padding={"$2"}
          borderRadius={16}
          onPress={() => router.push("/auth/email-input")}
        >
          <Text color="black" fontWeight={"$2"}>
            CREATE AN ACCOUNT
          </Text>
        </Button>

        <Button
          backgroundColor={"$backgroundTransparent"}
          padding={"$2"}
          borderRadius={16}
          borderColor={"white"}
          borderWidth={1}
          onPress={() => router.push("/auth/sign-in")}
        >
          <Text color="white" fontWeight={"$2"}>
            SIGN IN
          </Text>
        </Button>

        <Text fontWeight={"400"} alignSelf="center" marginBottom={"$4"}>
          Trouble signing in?
        </Text>
      </YStack>
    </View>
  );
};

export default AuthWelcome;
