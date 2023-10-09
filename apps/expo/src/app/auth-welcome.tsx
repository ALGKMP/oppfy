import React, { useEffect, useState } from "react";
import { ImageBackground, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Tinder from "@assets/tinder.png";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Button, Text, View, YStack } from "tamagui";
import { api } from "~/utils/api";

const AuthWelcome = () => {
  const router = useRouter();

  const [showSignInOptions, setShowSignInOptions] = useState(false);

  const ProviderRoutes = {
    apple: "profile",
    google: "auth/google",
    email: "auth/sign-in",
  };

  api.auth.test.useQuery();

  const providers = Object.entries(ProviderRoutes).map(([name, route]) => ({
    name,
    route,
  }));

  return (
    <View flex={1} backgroundColor="$background">
      <ImageBackground
        // source={Tinder}
        resizeMode="contain"
        imageStyle={{
          margin: 100,
        }}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {showSignInOptions && (
          <View style={{ position: "absolute", top: 40, left: 16 }}>
            <Pressable onPress={() => setShowSignInOptions(false)}>
              {({ pressed }) => (
                <ChevronLeft size="$2" style={{ opacity: pressed ? 0.5 : 1 }} />
              )}
            </Pressable>
          </View>
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
            <YStack space="$3">
              {/* Enclosed the buttons in a YStack for vertical spacing */}
              <Button
                animation="100ms"
                pressStyle={{
                  scale: 0.95,
                  backgroundColor: "white",
                }}
                backgroundColor="white"
                padding="$2"
                borderRadius={16}
                onPress={() =>
                  router.push({ pathname: "auth/sign-up/phone-number-input" })
                }
              >
                <Text color="black" 
                
                // fontWeight="$2"
                >
                  CREATE ACCOUNT
                </Text>
              </Button>
              <Button
                animation="100ms"
                pressStyle={{
                  scale: 0.95,
                  backgroundColor: "transparent",
                  borderColor: "white",
                }}
                backgroundColor="transparent"
                padding="$2"
                borderRadius={16}
                borderColor="white"
                borderWidth={1}
                onPress={() => setShowSignInOptions(true)}
              >
                <Text color="white" 
                // fontWeight="$2"
                >
                  SIGN IN
                </Text>
              </Button>
            </YStack>
          ) : (
            <YStack space="$3">
              {/* Enclosed the sign-in provider buttons in a YStack for vertical spacing */}
              {providers.map((provider) => (
                <Button
                  key={provider.name}
                  animation="100ms"
                  pressStyle={{
                    scale: 0.95,
                    backgroundColor: "transparent",
                    borderColor: "white",
                  }}
                  backgroundColor="$backgroundTransparent"
                  padding="$2"
                  borderRadius={16}
                  borderColor="white"
                  borderWidth={1}
                  onPress={() => router.replace(provider.route)}
                >
                  <Text color="white" 
                  // fontWeight="$2"
                  >
                    SIGN IN WITH {provider.name.toUpperCase()}
                  </Text>
                </Button>
              ))}
            </YStack>
          )}

          <Text fontWeight="400" alignSelf="center" marginTop="$2">
            {/* Added marginTop for spacing */}
            Trouble signing in?
          </Text>
        </YStack>
      </ImageBackground>
    </View>
  );
};

export default AuthWelcome;
