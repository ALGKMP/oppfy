import React, { useState } from "react";
import { ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import Tinder from "@assets/tinder.png";
import { Button, Image, Text, View, YStack } from "tamagui";

const AuthScreen = () => {
  const router = useRouter();

  const [showSignInOptions, setShowSignInOptions] = useState(false);

  const ProviderRoutes = {
    apple: "profile",
    google: "auth/google",
    email: "auth/email",
  };

  const providers = Object.entries(ProviderRoutes).map(([name, route]) => ({
    name,
    route,
  }));

  return (
    <View flex={1} backgroundColor="$background">
      <ImageBackground
        source={Tinder}
        resizeMode="contain"
        imageStyle={{
          margin: 100,
        }}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {showSignInOptions && (
          <Button
            onPress={() => setShowSignInOptions(false)}
            style={{ alignSelf: "flex-start", margin: 16 }}
          >
            <Text color="white">{"< Back"}</Text>
          </Button>
        )}

        <YStack marginHorizontal="$4" padding="$2" space="$4" marginBottom="$6">
          <Text padding="$2" textAlign="center" fontSize={12}>
            By tapping &apos;Sign in&apos; or &apos;Create an account&apos;, you
            agree with our{" "}
            <Text fontWeight="500" textDecorationLine="underline">
              Terms.
            </Text>{" "}
            Learn how we process your data in our{" "}
            <Text fontWeight="500" textDecorationLine="underline">
              Privacy Policy
            </Text>{" "}
            and{" "}
            <Text fontWeight="500" textDecorationLine="underline">
              Cookies Policy
            </Text>
            .
          </Text>

          {!showSignInOptions ? (
            <>
              <Button
                backgroundColor="white"
                padding="$2"
                borderRadius={16}
                onPress={() => 
                  router.push({
                    pathname: "/auth/email-input",
                  })
                }
              >
                <Text color="black" fontWeight="$2">
                  CREATE AN ACCOUNT
                </Text>
              </Button>

              <Button
                backgroundColor="$backgroundTransparent"
                padding="$2"
                borderRadius={16}
                borderColor="white"
                borderWidth={1}
                onPress={() => setShowSignInOptions(true)}
              >
                <Text color="white" fontWeight="$2">
                  SIGN IN
                </Text>
              </Button>
            </>
          ) : (
            providers.map((provider) => {
              return (
                <Button
                  key={provider.name}
                  backgroundColor="$backgroundTransparent"
                  padding="$2"
                  borderRadius={16}
                  borderColor="white"
                  borderWidth={1}
                  onPress={() => router.replace(provider.route)}
                >
                  <Text color="white" fontWeight="$2">
                    SIGN IN WITH {provider.name.toUpperCase()}
                  </Text>
                </Button>
              );
            })
          )}

          <Text fontWeight="400" alignSelf="center">
            Trouble signing in?
          </Text>
        </YStack>
      </ImageBackground>
    </View>
  );
};

export default AuthScreen;
