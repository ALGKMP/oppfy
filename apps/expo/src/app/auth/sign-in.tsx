import { useRouter } from "expo-router";
import Tinder from "@assets/tinder.png";
import { Button, Image, Text, View, YStack } from "tamagui";

const SignIn = () => {

  const ProviderRoutes = {
    apple: "profile",
    google: "auth/google",
    email: "auth/email",
  };

  const providers = Object.entries(ProviderRoutes).map(([name, route]) => ({ name, route }));
  const router = useRouter();

    // TODO: Logo fixed in center}
  return (
      <View flex={1} backgroundColor="$background">
        <View
          flex={1}
          alignItems="center"
          justifyContent="center"
          marginBottom="$4"
        >
          <Image source={Tinder} resizeMode="contain" />
        </View>

        <YStack marginHorizontal="$4" padding="$2" space="$4">
          <Text padding="$2" textAlign="center" fontSize={12}>
            By tapping &apos;Sign in&apos;, you agree with our{" "}
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
          {providers.map((provider) => {
            return (
              <Button
                key={provider.name}
                backgroundColor="$backgroundTransparent"
                padding="$2"
                borderRadius={16}
                borderColor="white"
                borderWidth={1}
                onPress={() => router.push(provider.route)}
              >
                <Text color="white" fontWeight="$2">
                  SIGN IN WITH {provider.name.toUpperCase()}
                </Text>
              </Button>
            );
          })}

          <Text fontWeight="400" alignSelf="center" marginBottom="$4">
            Trouble signing in?
          </Text>
        </YStack>
      </View>
  );
};

export default SignIn;
