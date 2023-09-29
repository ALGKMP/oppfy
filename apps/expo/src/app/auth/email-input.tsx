import { useRouter } from "expo-router";
import { Button, H1, Text, View, YStack} from "tamagui";

const EmailInput = () => {
  const router = useRouter();
  return (
    <View backgroundColor="$background">
      <YStack>
        <H1>EmailInput</H1>
        <Button
          marginTop={100}
          onPress={() =>
            router.push({
              pathname: "/auth/pass-input",
              params: {
                email: "test",
              },
            })
          }
        >
          <Text>Next</Text>
        </Button>
      </YStack>
    </View>
  );
};

export default EmailInput;
