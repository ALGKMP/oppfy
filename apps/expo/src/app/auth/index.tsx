import React from "react";
import { SafeAreaView } from "react-native";
import { Text, View, Image, YStack, Button, SizableText } from "tamagui";
import Tinder from "@assets/tinder.png";

const Index = () => {
  return (
    <View flex={1} backgroundColor={"$background"}>
      <View flex={1} alignItems="center" justifyContent="center" marginBottom="$4">
        <Image
          source={Tinder}
          resizeMode="contain"
        />
      </View>
      <YStack marginBottom="$6" marginHorizontal="$4"padding="$2" space={"$4"}>
        <Text padding={"$2"} textAlign="center">
          By tapping &apos;Sign in&apos;, you agree with our <Text fontWeight={"$16"} textDecorationLine="underline">Terms.</Text> Learn how we process your data in our <Text fontWeight={"$16"} textDecorationLine="underline">Privacy Policy</Text> and <Text fontWeight={"$16"} textDecorationLine="underline">Cookies Policy</Text>.
        </Text>
        <Button backgroundColor={"white"} padding={'$2'} borderRadius={16}>
          <Text color="black" fontWeight={"$2"}>
          Create Account
          </Text>
        </Button>

        <Button backgroundColor={"black"} padding={'$2'} borderRadius={16}>
          <SizableText color="white" fontWeight={"$2"}>
          Create Account
          </SizableText>
        </Button>

          <Text fontWeight={"500"} alignSelf="center">
            Trouble signing in?
          </Text>
      </YStack>
    </View>

  );
};

export default Index;
